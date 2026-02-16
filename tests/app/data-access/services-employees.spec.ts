/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access: getInfoService, getInfoEmployee e getCompanyTimes.
 * Valida retorno vazio sem userId, retorno de dados do Prisma e fallback quando Prisma falha.
 *
 * @example
 * npx jest tests/app/data-access/services-employees.spec.ts
 */
import prisma from '@/lib/prisma'
import { getInfoService } from '@/app/(panel)/dashboard/services/service/_data-access/get-info-service'
import { getInfoEmployee } from '@/app/(panel)/dashboard/services/employee/_data-access/get-info-employee'
import { getCompanyTimes } from '@/app/(panel)/dashboard/services/employee/_data-access/get-company-times'

describe('Data Access - Services & Employees', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getInfoService', () => {
		test('returns empty array when userId is empty', async () => {
			const result = await getInfoService({ userId: '' })
			expect(result).toEqual([])
			expect(prisma.service.findMany).not.toHaveBeenCalled()
		})

		test('returns services from prisma.service.findMany with deletedAt: null filter', async () => {
			const services = [
				{ id: 'srv_1', name: 'Corte', UserId: 'usr_1', deletedAt: null },
			]
			;(prisma.service.findMany as jest.Mock).mockResolvedValue(services)
			const result = await getInfoService({ userId: 'usr_1' })
			expect(result).toEqual(services)
			expect(prisma.service.findMany).toHaveBeenCalledWith({
				where: { UserId: 'usr_1', deletedAt: null },
				orderBy: { name: 'asc' },
			})
		})

		test('returns empty array when prisma throws', async () => {
			;(prisma.service.findMany as jest.Mock).mockRejectedValue(
				new Error('db error'),
			)
			const result = await getInfoService({ userId: 'usr_1' })
			expect(result).toEqual([])
		})
	})

	describe('getInfoEmployee', () => {
		test('returns empty array when userId is empty', async () => {
			const result = await getInfoEmployee({ userId: '' })
			expect(result).toEqual([])
			expect(prisma.employee.findMany).not.toHaveBeenCalled()
		})

		test('returns employees from prisma.employee.findMany with deletedAt: null filter', async () => {
			const employees = [
				{
					id: 'emp_1',
					name: 'João',
					UserId: 'usr_1',
					deletedAt: null,
					services: [],
				},
			]
			;(prisma.employee.findMany as jest.Mock).mockResolvedValue(employees)
			const result = await getInfoEmployee({ userId: 'usr_1' })
			expect(result).toEqual(employees)
			expect(prisma.employee.findMany).toHaveBeenCalledWith({
				where: { UserId: 'usr_1', deletedAt: null },
				include: {
					services: { include: { service: true } },
				},
				orderBy: { name: 'asc' },
			})
		})

		test('returns empty array when prisma throws', async () => {
			;(prisma.employee.findMany as jest.Mock).mockRejectedValue(
				new Error('db error'),
			)
			const result = await getInfoEmployee({ userId: 'usr_1' })
			expect(result).toEqual([])
		})
	})

	describe('getCompanyTimes', () => {
		test('returns null when userId is empty', async () => {
			const result = await getCompanyTimes({ userId: '' })
			expect(result).toBeNull()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})

		test('returns user times from prisma.user.findUnique', async () => {
			const userTimes = {
				mon_times: ['08:00', '09:00'],
				tue_times: [],
				wed_times: [],
				thu_times: [],
				fri_times: [],
				sat_times: [],
				sun_times: [],
			}
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userTimes)
			const result = await getCompanyTimes({ userId: 'usr_1' })
			expect(result).toEqual(userTimes)
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'usr_1' },
				select: {
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

		test('returns null when user not found', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
			const result = await getCompanyTimes({ userId: 'usr_1' })
			expect(result).toBeNull()
		})

		test('returns null when prisma throws', async () => {
			;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
				new Error('db error'),
			)
			const result = await getCompanyTimes({ userId: 'usr_1' })
			expect(result).toBeNull()
		})
	})
})
