/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes para utils/cep.ts (searchCep e formatCepDisplay).
 * Valida busca ViaCEP/BrasilAPI, fallback, erros e formatação de CEP.
 *
 * @example
 * npx jest tests/utils/cep.spec.ts
 */
import { searchCep, formatCepDisplay } from '@/utils/cep'

describe('cep', () => {
	const mockFetch = jest.fn()
	beforeEach(() => {
		jest.clearAllMocks()
		global.fetch = mockFetch
	})

	describe('searchCep', () => {
		test('returns error for invalid CEP (less than 8 digits)', async () => {
			const result = await searchCep('01310')
			expect(result.success).toBe(false)
			expect(result.error).toContain('8 dígitos')
			expect(mockFetch).not.toHaveBeenCalled()
		})

		test('returns error for empty CEP', async () => {
			const result = await searchCep('')
			expect(result.success).toBe(false)
			expect(result.error).toContain('8 dígitos')
			expect(mockFetch).not.toHaveBeenCalled()
		})

		test('returns success when ViaCEP responds ok', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					cep: '01310-100',
					logradouro: 'Avenida Paulista',
					complemento: '',
					bairro: 'Bela Vista',
					localidade: 'São Paulo',
					uf: 'SP',
				}),
			})
			const result = await searchCep('01310100')
			expect(result.success).toBe(true)
			expect(result.data?.logradouro).toBe('Avenida Paulista')
			expect(result.data?.localidade).toBe('São Paulo')
			expect(result.data?.uf).toBe('SP')
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('viacep.com.br'),
				expect.any(Object),
			)
		})

		test('falls back to BrasilAPI when ViaCEP fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: false, status: 404 })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						cep: '01310-100',
						street: 'Avenida Paulista',
						complement: '',
						neighborhood: 'Bela Vista',
						city: 'São Paulo',
						state: 'SP',
					}),
				})
			const result = await searchCep('01310100')
			expect(result.success).toBe(true)
			expect(result.data?.logradouro).toBe('Avenida Paulista')
			expect(result.data?.localidade).toBe('São Paulo')
			expect(mockFetch).toHaveBeenCalledTimes(2)
			expect(mockFetch).toHaveBeenNthCalledWith(
				1,
				expect.stringContaining('viacep.com.br'),
				expect.any(Object),
			)
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('brasilapi.com.br'),
				expect.any(Object),
			)
		})

		test('returns error when both APIs fail', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: false, status: 500 })
				.mockResolvedValueOnce({ ok: false, status: 404 })
			const result = await searchCep('01310100')
			expect(result.success).toBe(false)
			expect(result.error).toContain('não encontrado')
			expect(result.error).toContain('ViaCEP')
			expect(result.error).toContain('BrasilAPI')
		})

		test('returns error when ViaCEP returns { erro: true }', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ erro: true }),
				})
				.mockResolvedValueOnce({ ok: false, status: 404 })
			const result = await searchCep('01310100')
			expect(result.success).toBe(false)
			expect(result.error).toContain('não encontrado')
			expect(result.error).toContain('ViaCEP')
		})
	})

	describe('formatCepDisplay', () => {
		test('formats "01310100" to "01310-100"', () => {
			expect(formatCepDisplay('01310100')).toBe('01310-100')
		})

		test('returns digits-only for less than 8 digits (no hyphen)', () => {
			expect(formatCepDisplay('01310')).toBe('01310')
		})

		test('strips non-numeric characters before formatting', () => {
			expect(formatCepDisplay('01310-100')).toBe('01310-100')
			expect(formatCepDisplay('01310 100')).toBe('01310-100')
		})
	})
})
