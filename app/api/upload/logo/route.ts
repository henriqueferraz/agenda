/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
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

/**
 * Remove o arquivo de logo anterior do filesystem se existir.
 * @param logoPath - Caminho relativo do logo (ex: /uploads/logos/abc.png)
 */
const removeOldLogo = async (logoPath: string | null): Promise<void> => {
	if (!logoPath) return
	const absolutePath = path.join(process.cwd(), 'public', logoPath)
	try {
		await fs.unlink(absolutePath)
	} catch {
		// Arquivo pode nao existir mais — ignorar
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

		await removeOldLogo(user?.logo ?? null)

		const filename = `${session.id}-${crypto.randomUUID()}${ext}`
		const filePath = path.join(UPLOAD_DIR, filename)

		await fs.mkdir(UPLOAD_DIR, { recursive: true })

		const buffer = Buffer.from(await file.arrayBuffer())
		await fs.writeFile(filePath, buffer)

		const relativePath = `/uploads/logos/${filename}`

		await prisma.user.update({
			where: { id: session.id },
			data: { logo: relativePath },
		})

		revalidatePath('/dashboard', 'layout')
		revalidatePath('/dashboard/configurations/model')

		return NextResponse.json({ url: relativePath })
	} catch {
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

		await removeOldLogo(user.logo)

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
