/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Testes unitarios para POST /api/auth/register.
 * Valida criacao de conta com nome, email, CPF e senha, incluindo
 * validacao de CPF, unicidade de email/CPF e configuracao de trial.
 *
 * @example
 * npx jest tests/app/api/auth/register.spec.ts
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/register/route'
import { createJsonRequest, readJson } from '@/tests/helpers/request'

jest.mock('@/lib/password', () => ({
	hashPassword: jest.fn(async () => 'hashed-password'),
}))
jest.mock('@/lib/tokens', () => ({
	generateOtpCode: jest.fn(() => '123456'),
	hashToken: jest.fn(() => 'hashed-otp'),
}))
jest.mock('@/lib/email', () => ({
	sendEmail: jest.fn(async () => undefined),
}))
jest.mock('@/lib/password-policy', () => ({
	validatePasswordPolicy: jest.fn(() => ({ valid: true })),
}))
jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))
jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
}))

describe('POST /api/auth/register', () => {
	beforeEach(async () => {
		jest.clearAllMocks()
		const { validatePasswordPolicy } = await import('@/lib/password-policy')
		;(validatePasswordPolicy as jest.Mock).mockReturnValue({ valid: true })
	})

	const validPayload = {
		name: 'Henrique',
		email: 'henrique@teste.com',
		cpf: '12345678909',
		password: 'Senha@1234',
	}

	test('retorna 400 para payload invalido (sem CPF)', async () => {
		const request = createJsonRequest('http://localhost/api/auth/register', {
			name: 'Henrique',
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})

	test('retorna 400 para CPF invalido', async () => {
		const request = createJsonRequest('http://localhost/api/auth/register', {
			...validPayload,
			cpf: '11111111111',
		})
		const response = await POST(request)
		const body = await readJson<{ error: string }>(response)
		expect(response.status).toBe(400)
		expect(body.error).toBe('CPF inválido.')
	})

	test('retorna 409 quando email ja existe', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'usr_1' })

		const request = createJsonRequest('http://localhost/api/auth/register', validPayload)
		const response = await POST(request)
		const body = await readJson<{ error: string }>(response)
		expect(response.status).toBe(409)
		expect(body.error).toBe('Este email já está cadastrado.')
	})

	test('retorna 409 quando CPF ja existe', async () => {
		;(prisma.user.findUnique as jest.Mock)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce({ id: 'usr_2' })

		const request = createJsonRequest('http://localhost/api/auth/register', validPayload)
		const response = await POST(request)
		const body = await readJson<{ error: string }>(response)
		expect(response.status).toBe(409)
		expect(body.error).toBe('Este CPF já está cadastrado.')
	})

	test('cria usuario com role enterprise e trial de 30 dias', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.emailOtp.create as jest.Mock).mockResolvedValue({ id: 'otp_1' })

		const request = createJsonRequest('http://localhost/api/auth/register', validPayload)
		const response = await POST(request)
		expect(response.status).toBe(201)

		expect(prisma.user.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				role: 'enterprise',
				trialEndsAt: expect.any(Date),
				cpf: '12345678909',
			}),
		})
	})

	test('retorna 400 quando politica de senha falha', async () => {
		const { validatePasswordPolicy } = await import('@/lib/password-policy')
		;(validatePasswordPolicy as jest.Mock).mockReturnValue({
			valid: false,
			message: 'Senha fraca.',
		})
		const request = createJsonRequest('http://localhost/api/auth/register', validPayload)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})

	test('aceita CPF formatado com mascara', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.emailOtp.create as jest.Mock).mockResolvedValue({ id: 'otp_1' })

		const request = createJsonRequest('http://localhost/api/auth/register', {
			...validPayload,
			cpf: '271.823.220-05',
		})
		const response = await POST(request)
		expect(response.status).toBe(201)
	})
})
