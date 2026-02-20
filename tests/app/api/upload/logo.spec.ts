/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
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
})

describe('DELETE /api/upload/logo', () => {
	beforeEach(() => {
		jest.clearAllMocks()
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
