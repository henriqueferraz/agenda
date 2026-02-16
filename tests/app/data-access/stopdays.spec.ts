/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access de feriados: getStopDayByDate e getAllStopDays.
 * Valida retorno nulo sem userId e retorno correto com dados mockados.
 * Requer mock de getUserFromToken para autenticacao (H-12).
 *
 * @example
 * npx jest tests/app/data-access/stopdays.spec.ts
 */
import prisma from '@/lib/prisma'
import { getStopDayByDate } from '@/app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday-by-date'
import { getAllStopDays } from '@/app/(panel)/dashboard/schedule/stopday/_data-access/get-all-stopdays'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

describe('Data Access - StopDays', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('getStopDayByDate retorna null sem userId', async () => {
		const result = await getStopDayByDate({ userId: '', date: new Date() })
		expect(result).toBeNull()
	})

	test('getAllStopDays retorna lista', async () => {
		;(prisma.stopDay.findMany as jest.Mock).mockResolvedValue([{ id: 'sd_1' }])
		const result = await getAllStopDays({ userId: 'usr_1' })
		expect(result.length).toBe(1)
	})
})
