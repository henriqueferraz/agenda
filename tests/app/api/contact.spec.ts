/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes para POST /api/contact.
 * Valida rate limiting por IP, validação Zod (nome, email, mensagem),
 * env CONTACT_EMAIL_TO/CC e envio de email via sendEmail.
 *
 * @example
 * npx jest tests/app/api/contact.spec.ts
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/contact/route'

jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
}))
jest.mock('@/lib/email', () => ({
	sendEmail: jest.fn(async () => {}),
}))

const makeRequest = (
	body: Record<string, unknown>,
	ip = '1.2.3.4',
): NextRequest => {
	return new NextRequest('http://localhost/api/contact', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
	})
}

describe('POST /api/contact', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		process.env.CONTACT_EMAIL_TO = 'admin@test.com'
		process.env.CONTACT_EMAIL_CC = 'copy@test.com'
	})

	test('returns 429 when rate limited', async () => {
		const { checkIpRateLimit } = await import('@/lib/rate-limit')
		;(checkIpRateLimit as jest.Mock).mockResolvedValueOnce({
			allowed: false,
			blockedUntil: new Date(Date.now() + 60000),
		})
		const req = makeRequest({
			name: 'João',
			email: 'joao@test.com',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		const res = await POST(req)
		expect(res.status).toBe(429)
		const data = await res.json()
		expect(data.error).toContain('Muitas requisições')
	})

	test('returns 400 for invalid payload (missing name)', async () => {
		const req = makeRequest({
			email: 'joao@test.com',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		const res = await POST(req)
		expect(res.status).toBe(400)
		const data = await res.json()
		expect(data.error).toBeDefined()
	})

	test('returns 400 for invalid payload (short message)', async () => {
		const req = makeRequest({
			name: 'João',
			email: 'joao@test.com',
			message: 'Curta',
		})
		const res = await POST(req)
		expect(res.status).toBe(400)
		const data = await res.json()
		expect(data.error).toBeDefined()
	})

	test('returns 400 for invalid payload (bad email)', async () => {
		const req = makeRequest({
			name: 'João',
			email: 'notanemail',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		const res = await POST(req)
		expect(res.status).toBe(400)
		const data = await res.json()
		expect(data.error).toBeDefined()
	})

	test('returns 500 when CONTACT_EMAIL_TO not configured', async () => {
		delete process.env.CONTACT_EMAIL_TO
		const req = makeRequest({
			name: 'João',
			email: 'joao@test.com',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		const res = await POST(req)
		expect(res.status).toBe(500)
		const data = await res.json()
		expect(data.error).toContain('Erro interno')
	})

	test('returns 200 and sends email on success', async () => {
		const { sendEmail } = await import('@/lib/email')
		const req = makeRequest({
			name: 'João',
			email: 'joao@test.com',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		const res = await POST(req)
		expect(res.status).toBe(200)
		const data = await res.json()
		expect(data.message).toContain('sucesso')
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'admin@test.com',
				subject: 'Contato - João',
			}),
		)
	})

	test('sends CC email when CONTACT_EMAIL_CC is configured', async () => {
		const { sendEmail } = await import('@/lib/email')
		const req = makeRequest({
			name: 'Maria',
			email: 'maria@test.com',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		await POST(req)
		expect(sendEmail).toHaveBeenCalledTimes(2)
		expect(sendEmail).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				to: 'copy@test.com',
				subject: expect.stringContaining('Copia'),
			}),
		)
	})

	test('returns 500 when sendEmail throws', async () => {
		const { sendEmail } = await import('@/lib/email')
		;(sendEmail as jest.Mock).mockRejectedValueOnce(new Error('SMTP error'))
		const req = makeRequest({
			name: 'João',
			email: 'joao@test.com',
			message: 'Mensagem com pelo menos dez caracteres.',
		})
		const res = await POST(req)
		expect(res.status).toBe(500)
		const data = await res.json()
		expect(data.error).toContain('Erro interno')
	})
})
