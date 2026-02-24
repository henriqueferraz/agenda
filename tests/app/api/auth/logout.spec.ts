/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Teste - Logout.spec
 *
 * Visao geral:
 * - Casos de teste para Logout.spec.
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
 * import * as modulo from "@/tests/app/api/auth/logout.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/logout/route'
import { createRequestWithCookies, readJson } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/tokens', () => ({
	hashToken: jest.fn(() => 'hashed-refresh'),
}))
jest.mock('@/lib/auth-cookies', () => ({
	clearAuthCookies: jest.fn(),
}))
jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
}))
describe('POST /api/auth/logout', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 200 mesmo sem cookie', async () => {
		const request = createRequestWithCookies(
			'http://localhost/api/auth/logout',
			'POST',
			{},
		)
		const response = await POST(request)
		const body = await readJson<{
			message: string
		}>(response)
		expect(response.status).toBe(200)
		expect(body.message).toBe('Logout realizado com sucesso.')
	})
	test('revoga refresh token quando presente', async () => {
		;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
			count: 1,
		})
		const request = createRequestWithCookies(
			'http://localhost/api/auth/logout',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})

	test('retorna 429 quando rate limit bloqueia', async () => {
		const { checkIpRateLimit } = await import('@/lib/rate-limit')
		;(checkIpRateLimit as jest.Mock).mockResolvedValueOnce({
			allowed: false,
			blockedUntil: new Date().toISOString(),
		})
		const request = createRequestWithCookies(
			'http://localhost/api/auth/logout',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(429)
	})
})
