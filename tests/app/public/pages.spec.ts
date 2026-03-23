/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Teste - Pages.spec
 *
 * Visao geral:
 * - Casos de teste para Pages.spec.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar contratos e comportamento esperado.
 * - Cobrir cenarios de sucesso e falha.
 * - Proteger contra regressao.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/tests/app/public/pages.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
describe('Paginas publicas', () => {
	test('exports principais existem', async () => {
		const page = await import('@/app/(public)/page')
		const login = await import('@/app/(public)/login/page')
		const register = await import('@/app/(public)/register/page')
		const forgot = await import('@/app/(public)/forgot-password/page')
		const reset = await import('@/app/(public)/reset-password/page')
		const appointment = await import('@/app/(public)/agendamento/[token]/page')
		const shortBooking = await import('@/app/(public)/a/[code]/page')
		expect(typeof page.default).toBe('function')
		expect(typeof login.default).toBe('function')
		expect(typeof register.default).toBe('function')
		expect(typeof forgot.default).toBe('function')
		expect(typeof reset.default).toBe('function')
		expect(typeof appointment.default).toBe('function')
		expect(typeof shortBooking.default).toBe('function')
	})
})
