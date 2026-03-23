/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access: getUserToken, getUserTokenForWebhook, getStopDay,
 * getAppointmentsForDate e getCompanyByToken.
 * Valida parâmetros, retornos do Prisma e delegação/getAllStopDays mockado.
 *
 * @example
 * npx jest tests/app/data-access/tokens-stopday.spec.ts
 */
import prisma from '@/lib/prisma'
import { getUserToken } from '@/app/(panel)/dashboard/dashboard/_data-access/get-user-token'
import { getUserTokenForWebhook } from '@/app/(panel)/dashboard/schedule/calendar/_components/_data-access/get-user-token-for-webhook'
import { getStopDay } from '@/app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday'
import { getAppointmentsForDate } from '@/app/(panel)/dashboard/schedule/stopday/_data-access/get-appointments-for-date'
import { getCompanyByToken } from '@/app/(public)/agendamento/[token]/_data-access/get-company-by-token'

jest.mock(
	'@/app/(panel)/dashboard/schedule/stopday/_data-access/get-all-stopdays',
	() => ({
		getAllStopDays: jest.fn(async () => [
			{ id: 'sd_1', date: new Date(), motivation: 'Feriado' },
		]),
	}),
)

jest.mock('@/utils/date-timezone', () => ({
	startOfDayInSaoPaulo: jest.fn((d: Date) => d),
	endOfDayInSaoPaulo: jest.fn((d: Date) => d),
}))

const { getAllStopDays } = jest.requireMock(
	'@/app/(panel)/dashboard/schedule/stopday/_data-access/get-all-stopdays',
)

describe('Data Access - Tokens & StopDay', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(getAllStopDays as jest.Mock).mockResolvedValue([
			{ id: 'sd_1', date: new Date(), motivation: 'Feriado' },
		])
	})

	describe('getUserToken', () => {
		test('returns null when userId is empty', async () => {
			const result = await getUserToken({ userId: '' })
			expect(result).toBeNull()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})

		test('returns token_called from prisma', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				token_called: 'empresa-abc123',
			})
			const result = await getUserToken({ userId: 'usr_1' })
			expect(result).toBe('empresa-abc123')
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'usr_1' },
				select: { token_called: true },
			})
		})

		test('returns null when user not found', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
			const result = await getUserToken({ userId: 'usr_1' })
			expect(result).toBeNull()
		})
	})

	describe('getUserTokenForWebhook', () => {
		test('returns token_called from prisma', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				token_called: 'webhook-token',
			})
			const result = await getUserTokenForWebhook('usr_1')
			expect(result).toBe('webhook-token')
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'usr_1' },
				select: { token_called: true },
			})
		})

		test('returns null when user not found', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
			const result = await getUserTokenForWebhook('usr_1')
			expect(result).toBeNull()
		})

		test('returns null when prisma throws', async () => {
			;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
				new Error('db error'),
			)
			const result = await getUserTokenForWebhook('usr_1')
			expect(result).toBeNull()
		})
	})

	describe('getStopDay', () => {
		test('returns empty array when userId is empty', async () => {
			const result = await getStopDay({ userId: '' })
			expect(result).toEqual([])
			expect(getAllStopDays).not.toHaveBeenCalled()
		})

		test('delegates to getAllStopDays', async () => {
			const stopDays = [
				{ id: 'sd_1', date: new Date(), motivation: 'Feriado' },
			]
			;(getAllStopDays as jest.Mock).mockResolvedValue(stopDays)
			const result = await getStopDay({ userId: 'usr_1' })
			expect(result).toEqual(stopDays)
			expect(getAllStopDays).toHaveBeenCalledWith({ userId: 'usr_1' })
		})
	})

	describe('getAppointmentsForDate', () => {
		test('returns empty array when params missing', async () => {
			const result = await getAppointmentsForDate({
				userId: '',
				date: new Date(),
			})
			expect(result).toEqual([])
			const result2 = await getAppointmentsForDate({
				userId: 'usr_1',
				date: undefined as unknown as Date,
			})
			expect(result2).toEqual([])
		})

		test('returns mapped appointments with service and employee info', async () => {
			;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([
				{
					id: 'apt_1',
					clientId: 'cli_1',
					client: {
						id: 'cli_1',
						name: 'Cliente',
						email: 'c@test.com',
						phone: '11999999999',
					},
					time: '10:00',
					service: { id: 'srv_1', name: 'Corte' },
					employee: { id: 'emp_1', name: 'João' },
				},
			])
			const result = await getAppointmentsForDate({
				userId: 'usr_1',
				date: new Date('2026-02-16'),
			})
			expect(result).toHaveLength(1)
			expect(result[0]).toEqual({
				id: 'apt_1',
				name: 'Cliente',
				email: 'c@test.com',
				phone: '11999999999',
				time: '10:00',
				service: { id: 'srv_1', name: 'Corte' },
				employee: { id: 'emp_1', name: 'João' },
			})
		})
	})

	describe('getCompanyByToken', () => {
		test('returns null for empty or invalid token', async () => {
			expect(await getCompanyByToken({ token: '' })).toBeNull()
			expect(await getCompanyByToken({ token: 'INVALID!' })).toBeNull()
			expect(await getCompanyByToken({ token: 'A'.repeat(101) })).toBeNull()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})

		test('returns company data from prisma', async () => {
			const company = {
				id: 'usr_1',
				be_called: 'Barbearia',
				token_called: 'barbearia-xyz',
				mon_times: ['08:00'],
				tue_times: [],
				wed_times: [],
				thu_times: [],
				fri_times: [],
				sat_times: [],
				sun_times: [],
			}
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(company)
			const result = await getCompanyByToken({
				token: 'barbearia-xyz',
			})
			expect(result).toEqual(company)
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { token_called: 'barbearia-xyz' },
				select: {
					id: true,
					be_called: true,
					token_called: true,
					mon_times: true,
					tue_times: true,
					wed_times: true,
					thu_times: true,
					fri_times: true,
					sat_times: true,
					sun_times: true,
				},
			})
		})

		test('returns company by booking_public_code when token_called misses', async () => {
			const shortCode = 'a1b2c3d4e5f6g7h8i9j0'
			const company = {
				id: 'usr_2',
				be_called: 'Salao',
				token_called: 'salao-deadbeeff00d',
				mon_times: ['09:00'],
				tue_times: [],
				wed_times: [],
				thu_times: [],
				fri_times: [],
				sat_times: [],
				sun_times: [],
			}
			;(prisma.user.findUnique as jest.Mock)
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(company)
			const result = await getCompanyByToken({ token: shortCode })
			expect(result).toEqual(company)
			expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
				where: { token_called: shortCode },
				select: {
					id: true,
					be_called: true,
					token_called: true,
					mon_times: true,
					tue_times: true,
					wed_times: true,
					thu_times: true,
					fri_times: true,
					sat_times: true,
					sun_times: true,
				},
			})
			expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
				where: { booking_public_code: shortCode },
				select: {
					id: true,
					be_called: true,
					token_called: true,
					mon_times: true,
					tue_times: true,
					wed_times: true,
					thu_times: true,
					fri_times: true,
					sat_times: true,
					sun_times: true,
				},
			})
		})

		test('returns null when company not found', async () => {
			;(prisma.user.findUnique as jest.Mock)
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(null)
			const result = await getCompanyByToken({ token: 'unknown-token' })
			expect(result).toBeNull()
		})
	})
})
