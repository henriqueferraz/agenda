/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Teste - Resend Otp.spec
 *
 * Visao geral:
 * - Casos de teste para Resend Otp.spec.
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
 * import * as modulo from "@/tests/app/api/auth/resend-otp.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/resend-otp/route'
import { createJsonRequest } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/tokens', () => ({
	generateOtpCode: jest.fn(() => '123456'),
	hashToken: jest.fn(() => 'hashed-otp'),
}))
jest.mock('@/lib/email', () => ({
	sendEmail: jest.fn(async () => undefined),
}))
jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
}))
describe('POST /api/auth/resend-otp', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 400 para payload invalido', async () => {
		const request = createJsonRequest('http://localhost/api/auth/resend-otp', {
			email: 'invalid',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('retorna 200 com resposta genérica quando usuario nao existe', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest('http://localhost/api/auth/resend-otp', {
			email: 'henrique@teste.com',
		})
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('reenviar otp com sucesso', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			emailVerified: null,
		})
		;(prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.emailOtp.create as jest.Mock).mockResolvedValue({ id: 'otp_1' })
		const request = createJsonRequest('http://localhost/api/auth/resend-otp', {
			email: 'henrique@teste.com',
		})
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 200 com resposta genérica quando email ja verificado', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			emailVerified: new Date(),
		})
		const request = createJsonRequest('http://localhost/api/auth/resend-otp', {
			email: 'henrique@teste.com',
		})
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 429 quando cooldown ativo', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			emailVerified: null,
		})
		;(prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
			lastSentAt: new Date(),
		})
		const request = createJsonRequest('http://localhost/api/auth/resend-otp', {
			email: 'henrique@teste.com',
		})
		const response = await POST(request)
		expect(response.status).toBe(429)
	})
})
