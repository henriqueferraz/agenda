/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Rota de upload e remocao de logo da empresa.
 * POST: recebe FormData com campo "file" (PNG/JPG, max 1 MB),
 * salva em public/uploads/logos/ e atualiza user.logo no banco.
 * DELETE: remove o arquivo do filesystem e limpa user.logo.
 *
 * @example
 * const formData = new FormData()
 * formData.append('file', file)
 * const response = await fetch('/api/upload/logo', { method: 'POST', body: formData })
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

/** Tipos MIME aceitos para o logo */
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg'] as const

/** Extensoes aceitas mapeadas por MIME type */
const MIME_TO_EXT: Record<string, string> = {
	'image/png': '.png',
	'image/jpeg': '.jpg',
}

/** Tamanho maximo do arquivo em bytes (1 MB) */
const MAX_FILE_SIZE = 1_048_576

/** Diretorio de destino dos logos (relativo a raiz do projeto) */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos')
const LOCAL_LOGO_PREFIX = '/uploads/logos/'
const SUPABASE_STORAGE_DEFAULT_BUCKET = 'logos'

interface SupabaseStorageConfig {
	url: string
	serviceRoleKey: string
	bucket: string
}

const getSupabaseStorageConfig = (): SupabaseStorageConfig | null => {
	const url = process.env.SUPABASE_URL
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	const bucket =
		process.env.SUPABASE_STORAGE_LOGO_BUCKET || SUPABASE_STORAGE_DEFAULT_BUCKET

	if (!url || !serviceRoleKey) {
		return null
	}

	return {
		url,
		serviceRoleKey,
		bucket,
	}
}

const canWriteLocalFilesystem = (error: unknown): boolean => {
	if (!(error instanceof Error) || !('code' in error)) {
		return true
	}
	const code = (error as { code?: string }).code
	return !['EROFS', 'EPERM', 'EACCES'].includes(code ?? '')
}

const toDataUrl = (buffer: Buffer, mimeType: string): string => {
	return `data:${mimeType};base64,${buffer.toString('base64')}`
}

const isLocalLogoPath = (logoPath: string): boolean => {
	return logoPath.startsWith(LOCAL_LOGO_PREFIX)
}

const isDataUrl = (logoPath: string): boolean => {
	return logoPath.startsWith('data:')
}

const createSupabaseStorageClient = (config: SupabaseStorageConfig) => {
	return createClient(config.url, config.serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	})
}

const extractSupabaseObjectPath = (
	logoPath: string,
	config: SupabaseStorageConfig,
): string | null => {
	try {
		const url = new URL(logoPath)
		const marker = `/storage/v1/object/public/${config.bucket}/`
		const markerPosition = url.pathname.indexOf(marker)
		if (markerPosition === -1) {
			return null
		}
		const objectPath = url.pathname.slice(markerPosition + marker.length)
		return objectPath ? decodeURIComponent(objectPath) : null
	} catch {
		return null
	}
}

const uploadToSupabaseStorage = async ({
	config,
	objectPath,
	buffer,
	mimeType,
}: {
	config: SupabaseStorageConfig
	objectPath: string
	buffer: Buffer
	mimeType: string
}): Promise<string> => {
	const client = createSupabaseStorageClient(config)
	const uploadResult = await client.storage.from(config.bucket).upload(objectPath, buffer, {
		contentType: mimeType,
		upsert: false,
	})

	if (uploadResult.error) {
		throw new Error(uploadResult.error.message)
	}

	const publicUrlResult = client.storage.from(config.bucket).getPublicUrl(objectPath)
	return publicUrlResult.data.publicUrl
}

const removeSupabaseLogo = async (
	logoPath: string,
	config: SupabaseStorageConfig,
): Promise<void> => {
	const objectPath = extractSupabaseObjectPath(logoPath, config)
	if (!objectPath) return

	const client = createSupabaseStorageClient(config)
	const removeResult = await client.storage.from(config.bucket).remove([objectPath])
	if (removeResult.error) {
		console.warn('Nao foi possivel remover logo anterior do Supabase Storage.', {
			error: removeResult.error.message,
		})
	}
}

/**
 * Remove o arquivo de logo anterior do filesystem se existir.
 * @param logoPath - Caminho relativo do logo (ex: /uploads/logos/abc.png)
 */
const removeOldLogo = async (
	logoPath: string | null,
	supabaseConfig: SupabaseStorageConfig | null,
): Promise<void> => {
	if (!logoPath || isDataUrl(logoPath)) return

	if (supabaseConfig) {
		await removeSupabaseLogo(logoPath, supabaseConfig)
	}

	if (isLocalLogoPath(logoPath)) {
		const absolutePath = path.join(process.cwd(), 'public', logoPath)
		try {
			await fs.unlink(absolutePath)
		} catch {
			// Arquivo pode nao existir mais — ignorar
		}
	}
}

/**
 * POST /api/upload/logo — Faz upload do logo da empresa.
 * Valida autenticacao, tipo MIME, extensao e tamanho do arquivo.
 * Salva em public/uploads/logos/ com nome unico e atualiza user.logo.
 *
 * @param request - Request com FormData contendo campo "file"
 * @returns JSON com { url } do logo salvo ou { error }
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
	const session = await getUserFromToken()
	if (!session?.id) {
		return NextResponse.json(
			{ error: 'Usuário não autenticado.' },
			{ status: 401 },
		)
	}

	try {
		const formData = await request.formData()
		const file = formData.get('file')

		if (!file || !(file instanceof File)) {
			return NextResponse.json(
				{ error: 'Nenhum arquivo enviado.' },
				{ status: 400 },
			)
		}

		if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
			return NextResponse.json(
				{ error: 'Formato inválido. Envie apenas PNG ou JPG.' },
				{ status: 400 },
			)
		}

		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'Arquivo muito grande. Tamanho máximo: 1 MB.' },
				{ status: 400 },
			)
		}

		const ext = MIME_TO_EXT[file.type]
		if (!ext) {
			return NextResponse.json(
				{ error: 'Extensão de arquivo não suportada.' },
				{ status: 400 },
			)
		}

		const user = await prisma.user.findUnique({
			where: { id: session.id },
			select: { logo: true },
		})

		const filename = `${session.id}-${crypto.randomUUID()}${ext}`
		const filePath = path.join(UPLOAD_DIR, filename)
		const supabaseConfig = getSupabaseStorageConfig()

		const buffer = Buffer.from(await file.arrayBuffer())
		let logoPath = `${LOCAL_LOGO_PREFIX}${filename}`
		let hasStoredLogo = false

		if (supabaseConfig) {
			try {
				logoPath = await uploadToSupabaseStorage({
					config: supabaseConfig,
					objectPath: `${session.id}/${filename}`,
					buffer,
					mimeType: file.type,
				})
				hasStoredLogo = true
			} catch (supabaseError) {
				console.warn('Falha ao enviar logo para Supabase Storage.', {
					error:
						supabaseError instanceof Error
							? supabaseError.message
							: 'Erro desconhecido',
				})
			}
		}

		if (!hasStoredLogo) {
			try {
				await fs.mkdir(UPLOAD_DIR, { recursive: true })
				await fs.writeFile(filePath, buffer)
				hasStoredLogo = true
			} catch (writeError) {
				// Ambientes serverless podem bloquear escrita em disco.
				// Neste caso, fazemos fallback para data URL persistida no banco.
				if (canWriteLocalFilesystem(writeError)) {
					throw writeError
				}
				console.warn(
					'Upload de logo sem filesystem persistente, aplicando fallback data URL.',
				)
				logoPath = toDataUrl(buffer, file.type)
			}
		}

		await prisma.user.update({
			where: { id: session.id },
			data: { logo: logoPath },
		})
		await removeOldLogo(user?.logo ?? null, supabaseConfig)

		revalidatePath('/dashboard', 'layout')
		revalidatePath('/dashboard/configurations/model')

		return NextResponse.json({ url: logoPath })
	} catch (error) {
		console.error('Erro ao fazer upload do logo:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return NextResponse.json(
			{ error: 'Erro ao fazer upload do logo.' },
			{ status: 500 },
		)
	}
}

/**
 * DELETE /api/upload/logo — Remove o logo da empresa.
 * Deleta o arquivo do filesystem e limpa user.logo no banco.
 *
 * @param _request - Request (nao utiliza body)
 * @returns JSON com { data } de sucesso ou { error }
 */
export const DELETE = async (_request: NextRequest): Promise<NextResponse> => {
	const session = await getUserFromToken()
	if (!session?.id) {
		return NextResponse.json(
			{ error: 'Usuário não autenticado.' },
			{ status: 401 },
		)
	}

	try {
		const supabaseConfig = getSupabaseStorageConfig()
		const user = await prisma.user.findUnique({
			where: { id: session.id },
			select: { logo: true },
		})

		if (!user?.logo) {
			return NextResponse.json(
				{ error: 'Nenhum logo para remover.' },
				{ status: 404 },
			)
		}

		await removeOldLogo(user.logo, supabaseConfig)

		await prisma.user.update({
			where: { id: session.id },
			data: { logo: null },
		})

		revalidatePath('/dashboard', 'layout')
		revalidatePath('/dashboard/configurations/model')

		return NextResponse.json({ data: 'Logo removido com sucesso.' })
	} catch {
		return NextResponse.json(
			{ error: 'Erro ao remover o logo.' },
			{ status: 500 },
		)
	}
}
