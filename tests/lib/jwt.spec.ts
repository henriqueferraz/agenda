/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/jwt.ts.
 * Valida geração e verificação de access e refresh tokens JWT.
 *
 * @example
 * npx jest tests/lib/jwt.spec.ts
 */
import {
	signAccessToken,
	verifyAccessToken,
	signRefreshToken,
	verifyRefreshToken,
	ACCESS_TOKEN_MAX_AGE,
	REFRESH_TOKEN_MAX_AGE,
	REFRESH_EXPIRES_MS,
} from '@/lib/jwt'

describe('jwt', () => {
	beforeAll(() => {
		process.env.JWT_SECRET = 'test-secret'
		process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
	})

	afterAll(() => {
		delete process.env.JWT_SECRET
		delete process.env.JWT_REFRESH_SECRET
	})

	describe('constants', () => {
		test('ACCESS_TOKEN_MAX_AGE === 1800 (30 min)', () => {
			expect(ACCESS_TOKEN_MAX_AGE).toBe(1800)
		})

		test('REFRESH_TOKEN_MAX_AGE === 86400 (24h)', () => {
			expect(REFRESH_TOKEN_MAX_AGE).toBe(86400)
		})

		test('REFRESH_EXPIRES_MS === 86400000 (24h em ms)', () => {
			expect(REFRESH_EXPIRES_MS).toBe(86400000)
		})
	})

	describe('signAccessToken / verifyAccessToken', () => {
		test('signAccessToken generates a valid JWT with sub and email', () => {
			const token = signAccessToken({
				sub: 'user_123',
				email: 'user@example.com',
			})
			expect(typeof token).toBe('string')
			expect(token.split('.')).toHaveLength(3)
		})

		test('verifyAccessToken can decode what signAccessToken generates', () => {
			const payload = { sub: 'user_456', email: 'test@mail.com' }
			const token = signAccessToken(payload)
			const decoded = verifyAccessToken(token)
			expect(decoded.sub).toBe(payload.sub)
			expect(decoded.email).toBe(payload.email)
		})

		test('verifyAccessToken throws on invalid/tampered token', () => {
			const token = signAccessToken({ sub: 'u', email: 'e@e.com' })
			const tampered = token.slice(0, -3) + 'xxx'
			expect(() => verifyAccessToken(tampered)).toThrow()
		})

		test('signAccessToken throws Error if JWT_SECRET missing', () => {
			const orig = process.env.JWT_SECRET
			delete process.env.JWT_SECRET
			expect(() =>
				signAccessToken({ sub: 'u', email: 'e@e.com' }),
			).toThrow(/JWT_SECRET/)
			process.env.JWT_SECRET = orig
		})

		test('verifyAccessToken throws Error if JWT_SECRET missing', () => {
			const token = signAccessToken({ sub: 'u', email: 'e@e.com' })
			const orig = process.env.JWT_SECRET
			delete process.env.JWT_SECRET
			expect(() => verifyAccessToken(token)).toThrow(/JWT_SECRET/)
			process.env.JWT_SECRET = orig
		})
	})

	describe('signRefreshToken / verifyRefreshToken', () => {
		test('signRefreshToken generates a valid JWT', () => {
			const token = signRefreshToken({
				sub: 'user_123',
				email: 'user@example.com',
			})
			expect(typeof token).toBe('string')
			expect(token.split('.')).toHaveLength(3)
		})

		test('verifyRefreshToken can decode what signRefreshToken generates', () => {
			const payload = { sub: 'user_789', email: 'refresh@mail.com' }
			const token = signRefreshToken(payload)
			const decoded = verifyRefreshToken(token)
			expect(decoded.sub).toBe(payload.sub)
			expect(decoded.email).toBe(payload.email)
		})

		test('verifyRefreshToken throws on wrong secret (bad secret)', () => {
			const token = signRefreshToken({ sub: 'u', email: 'e@e.com' })
			const orig = process.env.JWT_REFRESH_SECRET
			process.env.JWT_REFRESH_SECRET = 'wrong-secret'
			expect(() => verifyRefreshToken(token)).toThrow()
			process.env.JWT_REFRESH_SECRET = orig
		})

		test('signRefreshToken throws Error if JWT_REFRESH_SECRET missing', () => {
			const orig = process.env.JWT_REFRESH_SECRET
			delete process.env.JWT_REFRESH_SECRET
			expect(() =>
				signRefreshToken({ sub: 'u', email: 'e@e.com' }),
			).toThrow(/JWT_REFRESH_SECRET/)
			process.env.JWT_REFRESH_SECRET = orig
		})

		test('verifyRefreshToken throws Error if JWT_REFRESH_SECRET missing', () => {
			const token = signRefreshToken({ sub: 'u', email: 'e@e.com' })
			const orig = process.env.JWT_REFRESH_SECRET
			delete process.env.JWT_REFRESH_SECRET
			expect(() => verifyRefreshToken(token)).toThrow(/JWT_REFRESH_SECRET/)
			process.env.JWT_REFRESH_SECRET = orig
		})
	})
})
