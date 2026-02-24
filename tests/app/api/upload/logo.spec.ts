/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Testes para POST e DELETE /api/upload/logo.
 * Valida autenticacao, tipos de arquivo aceitos (PNG/JPG),
 * limite de tamanho (1 MB) e remocao de logo.
 *
 * @example
 * npx jest tests/app/api/upload/logo.spec.ts
 */
import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/upload/logo/route'
import prisma from '@/lib/prisma'

const mockSupabaseUpload = jest.fn()
const mockSupabaseGetPublicUrl = jest.fn()
const mockSupabaseRemove = jest.fn()
const mockSupabaseFrom = jest.fn(() => ({
	upload: mockSupabaseUpload,
	getPublicUrl: mockSupabaseGetPublicUrl,
	remove: mockSupabaseRemove,
}))
const mockSupabaseCreateClient = jest.fn(() => ({
	storage: {
		from: mockSupabaseFrom,
	},
}))

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('node:fs/promises', () => ({
	mkdir: jest.fn(async () => {}),
	writeFile: jest.fn(async () => {}),
	unlink: jest.fn(async () => {}),
}))
jest.mock('@supabase/supabase-js', () => ({
	createClient: (...args: unknown[]) => mockSupabaseCreateClient(...args),
}))

const createFileRequest = (
	content: string,
	type: string,
	filename: string,
	size?: number,
): NextRequest => {
	const blob = new Blob([content], { type })
	const file = new File([blob], filename, { type })

	if (size) {
		Object.defineProperty(file, 'size', { value: size })
	}

	const formData = new FormData()
	formData.append('file', file)

	return new NextRequest('http://localhost/api/upload/logo', {
		method: 'POST',
		body: formData,
	})
}

describe('POST /api/upload/logo', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		delete process.env.SUPABASE_URL
		delete process.env.SUPABASE_SERVICE_ROLE_KEY
		delete process.env.SUPABASE_STORAGE_LOGO_BUCKET
	})

	test('upload PNG com sucesso', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ logo: null })
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })

		const request = createFileRequest('fake-png-data', 'image/png', 'logo.png')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.url).toMatch(/^\/uploads\/logos\/usr_1-.+\.png$/)
		expect(prisma.user.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					logo: expect.stringMatching(/^\/uploads\/logos\//),
				}),
			}),
		)
	})

	test('upload JPG com sucesso', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ logo: null })
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })

		const request = createFileRequest('fake-jpg-data', 'image/jpeg', 'logo.jpg')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.url).toMatch(/^\/uploads\/logos\/usr_1-.+\.jpg$/)
	})

	test('rejeita arquivo nao-imagem', async () => {
		const request = createFileRequest('fake-pdf', 'application/pdf', 'doc.pdf')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.error).toContain('PNG ou JPG')
	})

	test('rejeita arquivo maior que 1 MB', async () => {
		const largeContent = 'x'.repeat(1_048_577)
		const request = createFileRequest(largeContent, 'image/png', 'big.png')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.error).toContain('1 MB')
	})

	test('rejeita usuario nao autenticado', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const request = createFileRequest('data', 'image/png', 'logo.png')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(401)
		expect(data.error).toContain('autenticado')
	})

	test('remove logo anterior ao fazer novo upload', async () => {
		const fs = await import('node:fs/promises')
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			logo: '/uploads/logos/old-logo.png',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })

		const request = createFileRequest('new-logo', 'image/png', 'new.png')
		await POST(request)

		expect(fs.unlink).toHaveBeenCalledWith(
			expect.stringContaining('old-logo.png'),
		)
	})

	test('rejeita request sem arquivo', async () => {
		const formData = new FormData()
		const request = new NextRequest('http://localhost/api/upload/logo', {
			method: 'POST',
			body: formData,
		})

		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.error).toContain('arquivo')
	})

	test('faz fallback para data URL quando filesystem esta bloqueado', async () => {
		const fs = await import('node:fs/promises')
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ logo: null })
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(fs.writeFile as jest.Mock).mockRejectedValueOnce(
			Object.assign(new Error('Read-only file system'), { code: 'EROFS' }),
		)

		const request = createFileRequest('fake-png-data', 'image/png', 'logo.png')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.url).toMatch(/^data:image\/png;base64,/)
		expect(prisma.user.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					logo: expect.stringMatching(/^data:image\/png;base64,/),
				}),
			}),
		)
	})

	test('faz upload no Supabase Storage quando variaveis estao configuradas', async () => {
		const fs = await import('node:fs/promises')
		process.env.SUPABASE_URL = 'https://example.supabase.co'
		process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
		process.env.SUPABASE_STORAGE_LOGO_BUCKET = 'logos'

		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ logo: null })
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		mockSupabaseUpload.mockResolvedValueOnce({ data: { path: 'x' }, error: null })
		mockSupabaseGetPublicUrl.mockReturnValueOnce({
			data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/logos/usr_1/new-logo.png' },
		})
		mockSupabaseRemove.mockResolvedValueOnce({ data: [], error: null })

		const request = createFileRequest('fake-png-data', 'image/png', 'logo.png')
		const response = await POST(request)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.url).toBe(
			'https://example.supabase.co/storage/v1/object/public/logos/usr_1/new-logo.png',
		)
		expect(mockSupabaseFrom).toHaveBeenCalledWith('logos')
		expect(fs.writeFile).not.toHaveBeenCalled()
	})
})

describe('DELETE /api/upload/logo', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		delete process.env.SUPABASE_URL
		delete process.env.SUPABASE_SERVICE_ROLE_KEY
		delete process.env.SUPABASE_STORAGE_LOGO_BUCKET
	})

	test('remove logo com sucesso', async () => {
		const fs = await import('node:fs/promises')
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			logo: '/uploads/logos/existing.png',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })

		const request = new NextRequest('http://localhost/api/upload/logo', {
			method: 'DELETE',
		})
		const response = await DELETE(request)
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.data).toContain('removido')
		expect(fs.unlink).toHaveBeenCalledWith(
			expect.stringContaining('existing.png'),
		)
		expect(prisma.user.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { logo: null },
			}),
		)
	})

	test('retorna 404 se nao ha logo', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ logo: null })

		const request = new NextRequest('http://localhost/api/upload/logo', {
			method: 'DELETE',
		})
		const response = await DELETE(request)
		const data = await response.json()

		expect(response.status).toBe(404)
		expect(data.error).toContain('logo')
	})

	test('remove logo em data URL sem tentar apagar arquivo local', async () => {
		const fs = await import('node:fs/promises')
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			logo: 'data:image/png;base64,ZmFrZS1sb2dv',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })

		const request = new NextRequest('http://localhost/api/upload/logo', {
			method: 'DELETE',
		})
		const response = await DELETE(request)

		expect(response.status).toBe(200)
		expect(fs.unlink).not.toHaveBeenCalled()
		expect(prisma.user.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { logo: null },
			}),
		)
	})

	test('remove logo no Supabase Storage quando URL remota pertence ao bucket', async () => {
		process.env.SUPABASE_URL = 'https://example.supabase.co'
		process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
		process.env.SUPABASE_STORAGE_LOGO_BUCKET = 'logos'
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			logo: 'https://example.supabase.co/storage/v1/object/public/logos/usr_1/old-logo.png',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		mockSupabaseRemove.mockResolvedValueOnce({ data: [], error: null })

		const request = new NextRequest('http://localhost/api/upload/logo', {
			method: 'DELETE',
		})
		const response = await DELETE(request)

		expect(response.status).toBe(200)
		expect(mockSupabaseRemove).toHaveBeenCalledWith(['usr_1/old-logo.png'])
	})

	test('rejeita usuario nao autenticado', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const request = new NextRequest('http://localhost/api/upload/logo', {
			method: 'DELETE',
		})
		const response = await DELETE(request)

		expect(response.status).toBe(401)
	})
})
