/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/middleware-rate-limit.ts.
 * Valida rate limiting por IP, categorias de rota e sliding window.
 *
 * @example
 * npx jest tests/lib/middleware-rate-limit.spec.ts
 */
import {
	checkMiddlewareRateLimit,
	getClientIp,
	getRouteCategory,
	_resetRateLimitStore,
} from '@/lib/middleware-rate-limit'

describe('middleware-rate-limit', () => {
	beforeEach(() => {
		_resetRateLimitStore()
	})

	describe('getClientIp', () => {
		test('retorna x-real-ip quando presente', () => {
			const request = new Request('http://localhost', {
				headers: { 'x-real-ip': '10.0.0.1' },
			})
			expect(getClientIp(request)).toBe('10.0.0.1')
		})

		test('retorna primeiro IP do x-forwarded-for', () => {
			const request = new Request('http://localhost', {
				headers: { 'x-forwarded-for': '10.0.0.2, 10.0.0.3' },
			})
			expect(getClientIp(request)).toBe('10.0.0.2')
		})

		test('prioriza x-real-ip sobre x-forwarded-for', () => {
			const request = new Request('http://localhost', {
				headers: {
					'x-real-ip': '10.0.0.1',
					'x-forwarded-for': '10.0.0.2',
				},
			})
			expect(getClientIp(request)).toBe('10.0.0.1')
		})

		test('retorna unknown quando nenhum header presente', () => {
			const request = new Request('http://localhost')
			expect(getClientIp(request)).toBe('unknown')
		})
	})

	describe('getRouteCategory', () => {
		test('classifica /api/auth/login como auth', () => {
			expect(getRouteCategory('/api/auth/login')).toBe('auth')
		})

		test('classifica /api/auth/register como auth', () => {
			expect(getRouteCategory('/api/auth/register')).toBe('auth')
		})

		test('classifica /api/webhook/appointment como api', () => {
			expect(getRouteCategory('/api/webhook/appointment')).toBe('api')
		})

		test('classifica /api/cep/12345678 como api', () => {
			expect(getRouteCategory('/api/cep/12345678')).toBe('api')
		})

		test('classifica / como public', () => {
			expect(getRouteCategory('/')).toBe('public')
		})

		test('classifica /agendamento/abc como public', () => {
			expect(getRouteCategory('/agendamento/abc')).toBe('public')
		})

		test('classifica /dashboard como public', () => {
			expect(getRouteCategory('/dashboard')).toBe('public')
		})
	})

	describe('checkMiddlewareRateLimit', () => {
		test('permite primeira requisição', () => {
			const result = checkMiddlewareRateLimit('10.0.0.1', 'api')
			expect(result.allowed).toBe(true)
			expect(result.remaining).toBeGreaterThanOrEqual(0)
		})

		test('bloqueia auth após 10 requisições', () => {
			for (let i = 0; i < 10; i++) {
				const result = checkMiddlewareRateLimit('10.0.0.1', 'auth')
				expect(result.allowed).toBe(true)
			}
			const blocked = checkMiddlewareRateLimit('10.0.0.1', 'auth')
			expect(blocked.allowed).toBe(false)
			expect(blocked.remaining).toBe(0)
		})

		test('bloqueia api após 60 requisições', () => {
			for (let i = 0; i < 60; i++) {
				checkMiddlewareRateLimit('10.0.0.2', 'api')
			}
			const blocked = checkMiddlewareRateLimit('10.0.0.2', 'api')
			expect(blocked.allowed).toBe(false)
		})

		test('bloqueia public após 120 requisições', () => {
			for (let i = 0; i < 120; i++) {
				checkMiddlewareRateLimit('10.0.0.3', 'public')
			}
			const blocked = checkMiddlewareRateLimit('10.0.0.3', 'public')
			expect(blocked.allowed).toBe(false)
		})

		test('IPs diferentes têm contadores separados', () => {
			for (let i = 0; i < 10; i++) {
				checkMiddlewareRateLimit('10.0.0.4', 'auth')
			}
			const blocked = checkMiddlewareRateLimit('10.0.0.4', 'auth')
			expect(blocked.allowed).toBe(false)

			const other = checkMiddlewareRateLimit('10.0.0.5', 'auth')
			expect(other.allowed).toBe(true)
		})

		test('categorias diferentes têm contadores separados', () => {
			for (let i = 0; i < 10; i++) {
				checkMiddlewareRateLimit('10.0.0.6', 'auth')
			}
			const authBlocked = checkMiddlewareRateLimit('10.0.0.6', 'auth')
			expect(authBlocked.allowed).toBe(false)

			const apiAllowed = checkMiddlewareRateLimit('10.0.0.6', 'api')
			expect(apiAllowed.allowed).toBe(true)
		})

		test('retorna remaining decrementando', () => {
			const first = checkMiddlewareRateLimit('10.0.0.7', 'auth')
			const second = checkMiddlewareRateLimit('10.0.0.7', 'auth')
			expect(second.remaining).toBeLessThan(first.remaining)
		})

		test('retorna resetAt no futuro', () => {
			const result = checkMiddlewareRateLimit('10.0.0.8', 'api')
			const nowSeconds = Math.floor(Date.now() / 1000)
			expect(result.resetAt).toBeGreaterThan(nowSeconds)
		})

		test('reset limpa todos os contadores', () => {
			for (let i = 0; i < 10; i++) {
				checkMiddlewareRateLimit('10.0.0.9', 'auth')
			}
			expect(checkMiddlewareRateLimit('10.0.0.9', 'auth').allowed).toBe(false)

			_resetRateLimitStore()
			expect(checkMiddlewareRateLimit('10.0.0.9', 'auth').allowed).toBe(true)
		})
	})
})
