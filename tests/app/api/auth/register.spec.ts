/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Register.spec
 *
 * Visao geral:
 * - Casos de teste para Register.spec.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar contratos e comportamento esperado.
 * - Cobrir cenarios de sucesso e falha.
 * - Proteger contra regressao.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/tests/app/api/auth/register.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/register/route'
import { createJsonRequest, readJson } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
describe('POST /api/auth/register', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 400 para payload invalido', async () => {
		const request = createJsonRequest('http://localhost/api/auth/register', {
			email: 'invalid',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('retorna 409 quando email ja existe', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		const request = createJsonRequest('http://localhost/api/auth/register', {
			name: 'Henrique',
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		const body = await readJson<{
			error: string
		}>(response)
		expect(response.status).toBe(409)
		expect(body.error).toBe('Este email já está cadastrado.')
	})
	test('cria usuario e envia otp', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.emailOtp.create as jest.Mock).mockResolvedValue({ id: 'otp_1' })
		const request = createJsonRequest('http://localhost/api/auth/register', {
			name: 'Henrique',
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(201)
	})
	test('retorna 400 quando politica de senha falha', async () => {
		const { validatePasswordPolicy } = await import('@/lib/password-policy')
		;(validatePasswordPolicy as jest.Mock).mockReturnValue({
			valid: false,
			message: 'Senha fraca.',
		})
		const request = createJsonRequest('http://localhost/api/auth/register', {
			name: 'Henrique',
			email: 'henrique@teste.com',
			password: '12345678',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
})
