/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Teste - Verify Otp.spec
 *
 * Visao geral:
 * - Casos de teste para Verify Otp.spec.
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
 * import * as modulo from "@/tests/app/api/auth/verify-otp.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/verify-otp/route'
import { createJsonRequest } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/tokens', () => ({
	hashToken: jest.fn(() => 'hashed-code'),
}))
jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))
jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
}))
describe('POST /api/auth/verify-otp', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 400 para payload invalido', async () => {
		const request = createJsonRequest('http://localhost/api/auth/verify-otp', {
			email: 'invalid',
			code: '1',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('retorna 400 quando otp nao encontrado', async () => {
		;(prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest('http://localhost/api/auth/verify-otp', {
			email: 'henrique@teste.com',
			code: '123456',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('retorna 200 para codigo valido', async () => {
		;(prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
			id: 'otp_1',
			codeHash: 'hashed-code',
			attempts: 0,
		})
		;(prisma.emailOtp.update as jest.Mock).mockResolvedValue({ id: 'otp_1' })
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		const request = createJsonRequest('http://localhost/api/auth/verify-otp', {
			email: 'henrique@teste.com',
			code: '123456',
		})
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 429 quando otp bloqueado', async () => {
		;(prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
			id: 'otp_1',
			codeHash: 'hashed-code',
			attempts: 3,
			lockedUntil: new Date(Date.now() + 60 * 1000),
		})
		const request = createJsonRequest('http://localhost/api/auth/verify-otp', {
			email: 'henrique@teste.com',
			code: '123456',
		})
		const response = await POST(request)
		expect(response.status).toBe(429)
	})
	test('retorna 400 quando codigo invalido', async () => {
		;(prisma.emailOtp.findFirst as jest.Mock).mockResolvedValue({
			id: 'otp_1',
			codeHash: 'different-hash',
			attempts: 0,
		})
		;(prisma.emailOtp.update as jest.Mock).mockResolvedValue({ id: 'otp_1' })
		const request = createJsonRequest('http://localhost/api/auth/verify-otp', {
			email: 'henrique@teste.com',
			code: '123456',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
})
