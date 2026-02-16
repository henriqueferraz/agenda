/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Stopdays.spec
 *
 * Visao geral:
 * - Casos de teste para Stopdays.spec.
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
 * import * as modulo from "@/tests/app/actions/stopdays.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { createStopDay } from '@/app/(panel)/dashboard/schedule/stopday/_actions/create-stopday'
import { updateStopDay } from '@/app/(panel)/dashboard/schedule/stopday/_actions/update-stopday'
import { deleteStopDay } from '@/app/(panel)/dashboard/schedule/stopday/_actions/delete-stopday'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
describe('Server Actions - StopDays', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('createStopDay cria feriado', async () => {
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.stopDay.create as jest.Mock).mockResolvedValue({ id: 'sd_1' })
		const result = await createStopDay({
			date: new Date(),
			motivation: 'Feriado',
			userId: 'usr_1',
		})
		expect(result.success).toBe(true)
	})
	test('createStopDay retorna erro para feriado duplicado', async () => {
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue({ id: 'sd_1' })
		const result = await createStopDay({
			date: new Date(),
			motivation: 'Feriado',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
	})
	test('updateStopDay atualiza feriado', async () => {
		;(prisma.stopDay.findFirst as jest.Mock)
			.mockResolvedValueOnce({ id: 'sd_1', UserId: 'usr_1' })
			.mockResolvedValueOnce(null)
		;(prisma.stopDay.update as jest.Mock).mockResolvedValue({ id: 'sd_1' })
		const result = await updateStopDay({
			id: 'sd_1',
			date: new Date(),
			motivation: 'Novo motivo',
			userId: 'usr_1',
		})
		expect(result.success).toBe(true)
	})
	test('deleteStopDay remove feriado', async () => {
		;(prisma.stopDay.findUnique as jest.Mock).mockResolvedValue({
			id: 'sd_1',
			UserId: 'usr_1',
		})
		;(prisma.stopDay.delete as jest.Mock).mockResolvedValue({ id: 'sd_1' })
		const result = await deleteStopDay({
			id: 'sd_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(true)
	})
})
