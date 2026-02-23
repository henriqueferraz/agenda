/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access de bloqueios de horário: getAllBlockedTimes e
 * getBlockedTimesForEmployeeDate. Valida retorno vazio sem userId, retorno
 * correto com dados mockados e filtragem por funcionário/data.
 *
 * @example
 * npx jest tests/app/data-access/blocked-times.spec.ts
 */
import prisma from '@/lib/prisma'
import { getAllBlockedTimes } from '@/app/(panel)/dashboard/schedule/blocked-time/_data-access/get-all-blocked-times'
import { getBlockedTimesForEmployeeDate } from '@/app/(panel)/dashboard/schedule/blocked-time/_data-access/get-blocked-times-for-employee-date'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

describe('Data Access - BlockedTimes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('getAllBlockedTimes retorna lista com employee', async () => {
		;(prisma.blockedTime.findMany as jest.Mock).mockResolvedValue([
			{
				id: 'bt_1',
				date: new Date('2026-03-01'),
				time: '14:00',
				motivation: 'Consulta',
				employeeId: 'emp_1',
				createdAt: new Date(),
				updatedAt: new Date(),
				employee: { id: 'emp_1', name: 'João' },
			},
		])
		const result = await getAllBlockedTimes({ userId: 'usr_1' })
		expect(result.length).toBe(1)
		expect(result[0].employee.name).toBe('João')
		expect(result[0].time).toBe('14:00')
	})

	test('getAllBlockedTimes retorna vazio sem userId', async () => {
		const result = await getAllBlockedTimes({ userId: '' })
		expect(result).toEqual([])
	})

	test('getAllBlockedTimes retorna vazio para outro usuário', async () => {
		const result = await getAllBlockedTimes({ userId: 'usr_outro' })
		expect(result).toEqual([])
	})

	test('getBlockedTimesForEmployeeDate retorna bloqueios filtrados', async () => {
		;(prisma.blockedTime.findMany as jest.Mock).mockResolvedValue([
			{ id: 'bt_1', time: '14:00', motivation: 'Consulta' },
			{ id: 'bt_2', time: '15:30', motivation: 'Reunião' },
		])
		const result = await getBlockedTimesForEmployeeDate({
			employeeId: 'emp_1',
			date: new Date('2026-03-01'),
			userId: 'usr_1',
		})
		expect(result.length).toBe(2)
		expect(result[0].time).toBe('14:00')
		expect(result[1].time).toBe('15:30')
	})

	test('getBlockedTimesForEmployeeDate retorna vazio sem params', async () => {
		const result = await getBlockedTimesForEmployeeDate({
			employeeId: '',
			date: new Date('2026-03-01'),
			userId: 'usr_1',
		})
		expect(result).toEqual([])
	})

	test('getBlockedTimesForEmployeeDate retorna vazio em caso de erro', async () => {
		;(prisma.blockedTime.findMany as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)
		const result = await getBlockedTimesForEmployeeDate({
			employeeId: 'emp_1',
			date: new Date('2026-03-01'),
			userId: 'usr_1',
		})
		expect(result).toEqual([])
	})
})
