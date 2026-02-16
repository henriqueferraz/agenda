/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/tokens.ts.
 * Valida hashToken, generateRandomToken e generateOtpCode.
 *
 * @example
 * npx jest tests/lib/tokens.spec.ts
 */
import {
	hashToken,
	generateRandomToken,
	generateOtpCode,
} from '@/lib/tokens'

describe('tokens', () => {
	describe('hashToken', () => {
		test('produces consistent hex output for same input', () => {
			const input = 'my-token-123'
			expect(hashToken(input)).toBe(hashToken(input))
		})

		test('produces different output for different inputs', () => {
			expect(hashToken('a')).not.toBe(hashToken('b'))
		})

		test('returns hex string', () => {
			expect(hashToken('x')).toMatch(/^[0-9a-f]+$/)
		})
	})

	describe('generateRandomToken', () => {
		test('returns 64-char hex by default', () => {
			const token = generateRandomToken()
			expect(token).toMatch(/^[0-9a-f]{64}$/)
			expect(token.length).toBe(64)
		})

		test('generateRandomToken(16) returns 32-char hex', () => {
			const token = generateRandomToken(16)
			expect(token).toMatch(/^[0-9a-f]{32}$/)
			expect(token.length).toBe(32)
		})
	})

	describe('generateOtpCode', () => {
		test('returns 6-digit string', () => {
			const code = generateOtpCode()
			expect(code).toMatch(/^\d{6}$/)
		})

		test('produces strings between 100000 and 999999', () => {
			for (let i = 0; i < 20; i++) {
				const code = generateOtpCode()
				const num = Number(code)
				expect(num).toBeGreaterThanOrEqual(100000)
				expect(num).toBeLessThanOrEqual(999999)
			}
		})
	})
})
