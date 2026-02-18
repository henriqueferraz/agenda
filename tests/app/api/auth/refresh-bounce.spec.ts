/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes de GET /api/auth/refresh-bounce — renovação de sessão via redirect.
 * Verifica: refresh com sucesso redireciona para returnTo, refresh inválido
 * redireciona para login, e validação de returnTo previne open redirect.
 *
 * @example
 * npx jest tests/app/api/auth/refresh-bounce.spec.ts --no-cache
 */
import { GET } from '@/app/api/auth/refresh-bounce/route'
import { createRequestWithCookies } from '@/tests/helpers/request'

const mockPerformTokenRefresh = jest.fn()
jest.mock('@/lib/auth-refresh', () => ({
	performTokenRefresh: (...args: unknown[]) => mockPerformTokenRefresh(...args),
}))
jest.mock('@/lib/auth-cookies', () => ({
	setAuthCookies: jest.fn(),
}))

describe('GET /api/auth/refresh-bounce', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('redireciona para returnTo quando refresh é válido', async () => {
		mockPerformTokenRefresh.mockResolvedValue({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
		})

		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh-bounce?returnTo=/dashboard/schedule/calendar',
			'GET',
			{ refresh_token: 'valid-refresh' },
		)
		const response = await GET(request)

		expect(response.status).toBe(307)
		const location = response.headers.get('location')
		expect(location).toContain('/dashboard/schedule/calendar')
		expect(mockPerformTokenRefresh).toHaveBeenCalledWith('valid-refresh')
	})

	test('redireciona para /dashboard quando returnTo ausente', async () => {
		mockPerformTokenRefresh.mockResolvedValue({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
		})

		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh-bounce',
			'GET',
			{ refresh_token: 'valid-refresh' },
		)
		const response = await GET(request)

		expect(response.status).toBe(307)
		const location = response.headers.get('location')
		expect(location).toContain('/dashboard')
	})

	test('redireciona para login quando sem cookie refresh_token', async () => {
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh-bounce?returnTo=/dashboard',
			'GET',
			{},
		)
		const response = await GET(request)

		expect(response.status).toBe(307)
		const location = response.headers.get('location')
		expect(location).toContain('/')
		expect(location).not.toContain('/dashboard')
		expect(mockPerformTokenRefresh).not.toHaveBeenCalled()
	})

	test('redireciona para login quando performTokenRefresh retorna null', async () => {
		mockPerformTokenRefresh.mockResolvedValue(null)

		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh-bounce?returnTo=/dashboard',
			'GET',
			{ refresh_token: 'invalid-refresh' },
		)
		const response = await GET(request)

		expect(response.status).toBe(307)
		const location = response.headers.get('location')
		expect(location).toBe('http://localhost/')
	})

	test('previne open redirect com URL absoluta', async () => {
		mockPerformTokenRefresh.mockResolvedValue({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
		})

		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh-bounce?returnTo=https://evil.com/hack',
			'GET',
			{ refresh_token: 'valid-refresh' },
		)
		const response = await GET(request)

		expect(response.status).toBe(307)
		const location = response.headers.get('location')
		expect(location).toContain('/dashboard')
		expect(location).not.toContain('evil.com')
	})

	test('previne open redirect com protocol-relative URL', async () => {
		mockPerformTokenRefresh.mockResolvedValue({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
		})

		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh-bounce?returnTo=//evil.com/hack',
			'GET',
			{ refresh_token: 'valid-refresh' },
		)
		const response = await GET(request)

		expect(response.status).toBe(307)
		const location = response.headers.get('location')
		expect(location).toContain('/dashboard')
		expect(location).not.toContain('evil.com')
	})
})
