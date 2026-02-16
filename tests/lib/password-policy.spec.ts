/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/password-policy.ts.
 * Valida regras de complexidade: mínimo 8 caracteres, maiúscula, minúscula, número e especial.
 *
 * @example
 * npx jest tests/lib/password-policy.spec.ts
 */
import { validatePasswordPolicy } from '@/lib/password-policy'

describe('password-policy', () => {
	test('valid password: { valid: true }', () => {
		expect(validatePasswordPolicy('Abc@1234')).toEqual({ valid: true })
	})

	test('too short (<8): fails with message about 8 chars', () => {
		const result = validatePasswordPolicy('Abc@12')
		expect(result.valid).toBe(false)
		expect(result.message).toMatch(/8 caracteres/)
	})

	test('no uppercase: fails', () => {
		const result = validatePasswordPolicy('abc@1234')
		expect(result.valid).toBe(false)
		expect(result.message).toMatch(/maiúscula/)
	})

	test('no lowercase: fails', () => {
		const result = validatePasswordPolicy('ABC@1234')
		expect(result.valid).toBe(false)
		expect(result.message).toMatch(/minúscula/)
	})

	test('no number: fails', () => {
		const result = validatePasswordPolicy('Abcdefg@')
		expect(result.valid).toBe(false)
		expect(result.message).toMatch(/número/)
	})

	test('no special char: fails', () => {
		const result = validatePasswordPolicy('Abcdefg1')
		expect(result.valid).toBe(false)
		expect(result.message).toMatch(/especial/)
	})
})
