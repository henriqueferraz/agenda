/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/password.ts.
 * Valida hashing e verificação de senhas com bcrypt.
 *
 * @example
 * npx jest tests/lib/password.spec.ts
 */
import { hashPassword, verifyPassword } from '@/lib/password'

describe('password', () => {
	describe('hashPassword', () => {
		test('returns a bcrypt hash (starts with $2b$)', async () => {
			const hash = await hashPassword('MyP@ssw0rd')
			expect(hash).toMatch(/^\$2[ab]\$/)
		})

		test('different calls produce different hashes (salt)', async () => {
			const hash1 = await hashPassword('same-password')
			const hash2 = await hashPassword('same-password')
			expect(hash1).not.toBe(hash2)
		})
	})

	describe('verifyPassword', () => {
		test('returns true for correct password', async () => {
			const password = 'CorrectP@ss1'
			const hash = await hashPassword(password)
			const result = await verifyPassword(password, hash)
			expect(result).toBe(true)
		})

		test('returns false for wrong password', async () => {
			const hash = await hashPassword('CorrectP@ss1')
			const result = await verifyPassword('WrongPassword1!', hash)
			expect(result).toBe(false)
		})
	})
})
