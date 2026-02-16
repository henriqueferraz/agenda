/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/utils.ts.
 * Valida cn, formatCurrency, formatDate, capitalize, normalizeString, slugify, truncate, isValidEmail, generateId.
 *
 * @example
 * npx jest tests/lib/utils.spec.ts
 */
import {
	cn,
	formatCurrency,
	formatDate,
	capitalize,
	normalizeString,
	slugify,
	truncate,
	isValidEmail,
	generateId,
} from '@/lib/utils'

describe('utils', () => {
	describe('cn', () => {
		test('merges classes correctly', () => {
			expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
			expect(cn('px-4', false && 'hidden', 'py-2')).toBe('px-4 py-2')
		})
	})

	describe('formatCurrency', () => {
		test('formatCurrency(1500) = "R$ 15,00"', () => {
			expect(formatCurrency(1500)).toMatch(/R\$\s*15,00/)
		})

		test('formatCurrency(100050) = "R$ 1.000,50"', () => {
			expect(formatCurrency(100050)).toMatch(/R\$\s*1\.000,50/)
		})
	})

	describe('formatDate', () => {
		test('formats to dd/mm/yyyy', () => {
			const date = new Date('2026-02-16T12:00:00Z')
			expect(formatDate(date)).toMatch(/^\d{2}\/\d{2}\/2026$/)
		})

		test('formatDate with time option', () => {
			const date = new Date('2026-02-16T14:30:00Z')
			const result = formatDate(date, { time: true })
			expect(result).toMatch(/\d{2}\/\d{2}\/2026/)
			expect(result).toMatch(/\d{2}:\d{2}/)
		})
	})

	describe('capitalize', () => {
		test('capitalize("joão da silva") = "João Da Silva"', () => {
			expect(capitalize('joão da silva')).toBe('João Da Silva')
		})
	})

	describe('normalizeString', () => {
		test('removes accents', () => {
			expect(normalizeString('João André')).toBe('joao andre')
		})
	})

	describe('slugify', () => {
		test('creates url-friendly slug', () => {
			expect(slugify('Serviço de Corte de Cabelo')).toBe(
				'servico-de-corte-de-cabelo',
			)
		})
	})

	describe('truncate', () => {
		test('with text shorter than limit returns original', () => {
			expect(truncate('short', 10)).toBe('short')
		})

		test('with text longer adds "..."', () => {
			expect(truncate('this is a long text', 10)).toBe('this is...')
		})
	})

	describe('isValidEmail', () => {
		test('validates correctly', () => {
			expect(isValidEmail('user@example.com')).toBe(true)
			expect(isValidEmail('invalid-email')).toBe(false)
			expect(isValidEmail('a@b.co')).toBe(true)
		})
	})

	describe('generateId', () => {
		test('produces prefixed UUID', () => {
			const id = generateId('usr')
			expect(id).toMatch(/^usr_[0-9a-f-]{36}$/)
		})

		test('default prefix is "id"', () => {
			expect(generateId()).toMatch(/^id_[0-9a-f-]{36}$/)
		})
	})
})
