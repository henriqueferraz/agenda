/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Teste - Refresh.spec
 *
 * Visao geral:
 * - Casos de teste para Refresh.spec.
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
 * import * as modulo from "@/tests/app/api/auth/refresh.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { POST } from '@/app/api/auth/refresh/route'
import { createRequestWithCookies, readJson } from '@/tests/helpers/request'

const mockPerformTokenRefresh = jest.fn()
jest.mock('@/lib/auth-refresh', () => ({
	performTokenRefresh: (...args: unknown[]) => mockPerformTokenRefresh(...args),
}))
jest.mock('@/lib/auth-cookies', () => ({
	setAuthCookies: jest.fn(),
}))
jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
}))

describe('POST /api/auth/refresh', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('retorna 401 sem cookie', async () => {
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{},
		)
		const response = await POST(request)
		expect(response.status).toBe(401)
	})

	test('retorna 401 quando performTokenRefresh retorna null', async () => {
		mockPerformTokenRefresh.mockResolvedValue(null)
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		const body = await readJson<{ error: string }>(response)
		expect(response.status).toBe(401)
		expect(body.error).toBe('Refresh token inválido.')
	})

	test('gera novos tokens com sucesso', async () => {
		mockPerformTokenRefresh.mockResolvedValue({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
		})
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		const body = await readJson<{ message: string }>(response)
		expect(response.status).toBe(200)
		expect(body.message).toBe('Token atualizado.')
		expect(mockPerformTokenRefresh).toHaveBeenCalledWith('refresh-token')
	})

	test('retorna 500 quando performTokenRefresh lança exceção', async () => {
		mockPerformTokenRefresh.mockRejectedValue(new Error('erro inesperado'))
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})

	test('retorna 429 quando rate limit bloqueia', async () => {
		const { checkIpRateLimit } = await import('@/lib/rate-limit')
		;(checkIpRateLimit as jest.Mock).mockResolvedValueOnce({
			allowed: false,
			blockedUntil: new Date().toISOString(),
		})
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(429)
	})
})
