/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Rate Limit.spec
 *
 * Visao geral:
 * - Casos de teste para Rate Limit.spec.
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
 * import * as modulo from "@/tests/lib/rate-limit.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { recordLoginFailure, recordLoginSuccess } from '@/lib/rate-limit'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
describe('Rate limit - tentativas progressivas', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('recordLoginFailure cria tentativa quando nao existe', async () => {
		;(prisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.loginAttempt.create as jest.Mock).mockResolvedValue({ id: 'la_1' })
		const result = await recordLoginFailure('user@teste.com')
		expect(result).toBeNull()
	})
	test('recordLoginFailure aplica bloqueio progressivo', async () => {
		;(prisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue({
			id: 'la_1',
			count: 4,
			lockedUntil: null,
		})
		;(prisma.loginAttempt.update as jest.Mock).mockResolvedValue({ id: 'la_1' })
		const lockedUntil = await recordLoginFailure('user@teste.com')
		expect(lockedUntil).toBeInstanceOf(Date)
	})
	test('recordLoginSuccess zera tentativas', async () => {
		;(prisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue({
			id: 'la_1',
		})
		;(prisma.loginAttempt.update as jest.Mock).mockResolvedValue({ id: 'la_1' })
		await recordLoginSuccess('user@teste.com')
		expect(prisma.loginAttempt.update).toHaveBeenCalled()
	})
})
