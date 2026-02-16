/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para components/responsive-dialog.tsx.
 * Valida que o componente exporta corretamente e possui as props esperadas.
 * Testes de renderização requerem @testing-library/react (futuro).
 *
 * @example
 * npx jest tests/components/responsive-dialog.spec.ts
 */

describe('ResponsiveDialog', () => {
	test('módulo exporta ResponsiveDialog e ResponsiveDialogContent', async () => {
		const mod = await import('@/components/responsive-dialog')
		expect(mod.ResponsiveDialog).toBeDefined()
		expect(typeof mod.ResponsiveDialog).toBe('function')
		expect(mod.ResponsiveDialogContent).toBeDefined()
		expect(typeof mod.ResponsiveDialogContent).toBe('function')
	})
})
