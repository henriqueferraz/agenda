/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access do calendário estendido: getCalendarData, getDayAppointments,
 * getMonthAppointments, getInfoCalendar e getNextAppointmentDate.
 * Valida autenticação, parâmetros e retornos com Prisma mockado.
 *
 * @example
 * npx jest tests/app/data-access/calendar-extended.spec.ts
 */
import prisma from '@/lib/prisma'
import { getCalendarData } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-calendar-data'
import { getDayAppointments } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-day-appointments'
import { getMonthAppointments } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-month-appointments'
import { getInfoCalendar } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-info-calendar'
import { getNextAppointmentDate } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-next-appointment-date'

const mockGetUserFromToken = jest.fn<Promise<{ id: string } | null>, unknown[]>(async () => ({ id: 'usr_1' }))
jest.mock('@/lib/auth', () => ({
	getUserFromToken: () => mockGetUserFromToken(),
}))

jest.mock('@/utils/date-timezone', () => ({
	startOfDayInSaoPaulo: jest.fn((d: Date) => d),
	endOfDayInSaoPaulo: jest.fn((d: Date) => d),
	getNowInSaoPaulo: jest.fn(() => new Date('2026-02-16T12:00:00')),
	createDateInSaoPaulo: jest.fn(
		(y: number, m: number, d?: number, h = 0, min = 0, s = 0, ms = 0) =>
			new Date(y, m, d ?? 1, h, min, s, ms),
	),
	getDateComponentsInSaoPaulo: jest.fn((d: Date) => ({
		year: d.getFullYear(),
		month: d.getMonth(),
		day: d.getDate(),
	})),
}))

describe('Data Access - Calendar Extended', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockGetUserFromToken.mockResolvedValue({ id: 'usr_1' })
	})

	describe('getCalendarData', () => {
		test('returns null when session does not match userId', async () => {
			mockGetUserFromToken.mockResolvedValue({ id: 'usr_other' })
			const result = await getCalendarData({ userId: 'usr_1' })
			expect(result).toBeNull()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})

		test('returns null when userId is empty', async () => {
			const result = await getCalendarData({ userId: '' })
			expect(result).toBeNull()
		})

		test('returns calendar data (companyTimes, employees, services) on success', async () => {
			const companyTimes = {
				mon_times: ['08:00'],
				tue_times: [],
				wed_times: [],
				thu_times: [],
				fri_times: [],
				sat_times: [],
				sun_times: [],
			}
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(companyTimes)
			;(prisma.employee.findMany as jest.Mock).mockResolvedValue([
				{ id: 'emp_1', name: 'João' },
			])
			;(prisma.service.findMany as jest.Mock).mockResolvedValue([
				{ id: 'srv_1', name: 'Corte' },
			])
			const result = await getCalendarData({ userId: 'usr_1' })
			expect(result).not.toBeNull()
			expect(result?.companyTimes).toEqual(companyTimes)
			expect(result?.employees).toHaveLength(1)
			expect(result?.services).toHaveLength(1)
		})

		test('returns null when prisma throws', async () => {
			;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
				new Error('db error'),
			)
			const result = await getCalendarData({ userId: 'usr_1' })
			expect(result).toBeNull()
		})
	})

	describe('getDayAppointments', () => {
		test('returns empty array when not authenticated', async () => {
			mockGetUserFromToken.mockResolvedValue(null)
			const result = await getDayAppointments({
				userId: 'usr_1',
				date: new Date(),
			})
			expect(result).toEqual([])
		})

		test('returns empty array when params missing', async () => {
			const result = await getDayAppointments({
				userId: '',
				date: new Date(),
			})
			expect(result).toEqual([])
			const result2 = await getDayAppointments({
				userId: 'usr_1',
				date: undefined as unknown as Date,
			})
			expect(result2).toEqual([])
		})

		test('returns empty array when userId does not match session', async () => {
			mockGetUserFromToken.mockResolvedValue({ id: 'usr_other' })
			const result = await getDayAppointments({
				userId: 'usr_1',
				date: new Date(),
			})
			expect(result).toEqual([])
		})

		test('returns appointments from prisma', async () => {
			const appointments = [
				{
					id: 'apt_1',
					name: 'Cliente',
					time: '10:00',
					service: { id: 'srv_1', name: 'Corte' },
					employee: { id: 'emp_1', name: 'João' },
				},
			]
			;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(
				appointments,
			)
			const result = await getDayAppointments({
				userId: 'usr_1',
				date: new Date('2026-02-16'),
			})
			expect(result).toEqual(appointments)
			expect(prisma.appointment.findMany).toHaveBeenCalled()
		})
	})

	describe('getMonthAppointments', () => {
		test('returns empty array when session does not match', async () => {
			mockGetUserFromToken.mockResolvedValue({ id: 'usr_other' })
			const result = await getMonthAppointments({
				userId: 'usr_1',
				year: 2026,
				month: 1,
			})
			expect(result).toEqual([])
		})

		test('returns array of day numbers from appointments', async () => {
			;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([
				{ appointmentDate: new Date('2026-02-01T10:00:00') },
				{ appointmentDate: new Date('2026-02-05T10:00:00') },
				{ appointmentDate: new Date('2026-02-05T14:00:00') },
			])
			const result = await getMonthAppointments({
				userId: 'usr_1',
				year: 2026,
				month: 1,
			})
			expect(result).toContain(1)
			expect(result).toContain(5)
			expect(result.length).toBe(2)
		})
	})

	describe('getInfoCalendar', () => {
		test('returns empty array when session does not match', async () => {
			mockGetUserFromToken.mockResolvedValue({ id: 'usr_other' })
			const result = await getInfoCalendar({ userId: 'usr_1' })
			expect(result).toEqual([])
		})

		test('returns users with relationships', async () => {
			const users = [
				{
					id: 'usr_1',
					name: 'Empresa',
					appointment: [],
					employee: [],
					service: [],
				},
			]
			;(prisma.user.findMany as jest.Mock).mockResolvedValue(users)
			const result = await getInfoCalendar({ userId: 'usr_1' })
			expect(result).toEqual(users)
			expect(prisma.user.findMany).toHaveBeenCalledWith({
				where: { id: 'usr_1' },
				include: { appointment: true, employee: true, service: true },
			})
		})
	})

	describe('getNextAppointmentDate', () => {
		test('returns null when session does not match', async () => {
			mockGetUserFromToken.mockResolvedValue({ id: 'usr_other' })
			const result = await getNextAppointmentDate({ userId: 'usr_1' })
			expect(result).toBeNull()
		})

		test('returns appointment date when found', async () => {
			const nextDate = new Date('2026-02-20T14:00:00')
			;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
				appointmentDate: nextDate,
			})
			const result = await getNextAppointmentDate({ userId: 'usr_1' })
			expect(result).toEqual(nextDate)
		})

		test('returns null when no future appointments', async () => {
			;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)
			const result = await getNextAppointmentDate({ userId: 'usr_1' })
			expect(result).toBeNull()
		})
	})
})
