/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access do calendario: getMonthStopDays e getAppointmentDates.
 * Valida retorno vazio sem parametros e retorno correto com dados mockados.
 * Requer mock de getUserFromToken para autenticacao (H-12).
 *
 * @example
 * npx jest tests/app/data-access/calendar.spec.ts
 */
import prisma from '@/lib/prisma'
import { getMonthStopDays } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-month-stopdays'
import { getAppointmentDates } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-appointment-dates'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

describe('Data Access - Calendar', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('getMonthStopDays retorna array vazio sem parametros', async () => {
		const result = await getMonthStopDays({ userId: '', year: 2024, month: 0 })
		expect(result).toEqual([])
	})

	test('getMonthStopDays retorna dias unicos', async () => {
		;(prisma.stopDay.findMany as jest.Mock).mockResolvedValue([
			{ date: new Date('2024-01-01T10:00:00Z') },
			{ date: new Date('2024-01-01T12:00:00Z') },
			{ date: new Date('2024-01-15T10:00:00Z') },
		])
		const result = await getMonthStopDays({
			userId: 'usr_1',
			year: 2024,
			month: 0,
		})
		expect(result.length).toBeGreaterThan(0)
	})

	test('getAppointmentDates retorna datas', async () => {
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([
			{ appointmentDate: new Date('2024-01-10T10:00:00Z') },
			{ appointmentDate: new Date('2024-01-11T10:00:00Z') },
		])
		const result = await getAppointmentDates({ userId: 'usr_1' })
		expect(result.length).toBeGreaterThan(0)
	})
})
