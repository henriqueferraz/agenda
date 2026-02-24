/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Teste - Reset Password.spec
 *
 * Visao geral:
 * - Casos de teste para Reset Password.spec.
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
 * import * as modulo from "@/tests/app/api/auth/reset-password.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/reset-password/route'
import { createJsonRequest } from '@/tests/helpers/request'
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
	hashToken: jest.fn(() => 'hashed-token'),
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
describe('POST /api/auth/reset-password', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 400 para payload invalido', async () => {
		const request = createJsonRequest(
			'http://localhost/api/auth/reset-password',
			{
				token: 'short',
				password: '123',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('retorna 400 para token invalido', async () => {
		;(prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest(
			'http://localhost/api/auth/reset-password',
			{
				token: 'validtokenvalue',
				password: 'Senha@1234',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('reseta senha com sucesso', async () => {
		;(prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue({
			id: 'prt_1',
			email: 'henrique@teste.com',
		})
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			email: 'henrique@teste.com',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.passwordResetToken.update as jest.Mock).mockResolvedValue({
			id: 'prt_1',
		})
		;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
			count: 1,
		})
		const request = createJsonRequest(
			'http://localhost/api/auth/reset-password',
			{
				token: 'validtokenvalue',
				password: 'Senha@1234',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 404 quando usuario nao encontrado', async () => {
		;(prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue({
			id: 'prt_1',
			email: 'henrique@teste.com',
		})
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest(
			'http://localhost/api/auth/reset-password',
			{
				token: 'validtokenvalue',
				password: 'Senha@1234',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(404)
	})
})
