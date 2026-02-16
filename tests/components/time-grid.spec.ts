/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para components/time-grid.tsx.
 * Valida exports e estrutura do componente TimeGrid.
 *
 * @example
 * npx jest tests/components/time-grid.spec.ts
 */

describe('TimeGrid', () => {
	test('módulo exporta TimeGrid', async () => {
		const mod = await import('@/components/time-grid')
		expect(mod.TimeGrid).toBeDefined()
		expect(typeof mod.TimeGrid).toBe('function')
	})
})
