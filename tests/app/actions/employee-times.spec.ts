/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action updateEmployeeTimes.
 * Valida autenticação, validação Zod (employeeId, HH:MM), propriedade,
 * ordenação e deduplicação de horários, e revalidação de path.
 *
 * @example
 * npx jest tests/app/actions/employee-times.spec.ts
 */
import prisma from '@/lib/prisma'
import { resetPrismaMock } from '@/tests/__mocks__/prisma'
import { updateEmployeeTimes } from '@/app/(panel)/dashboard/services/employee/_actions/update-employee-times'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('updateEmployeeTimes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		resetPrismaMock()
	})

	test('returns error when not authenticated (getUserFromToken returns null)', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)
		const result = await updateEmployeeTimes({
			employeeId: 'emp_1',
			mon_times: ['08:00'],
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('não autenticado')
	})

	test('returns error for invalid data (empty employeeId)', async () => {
		const result = await updateEmployeeTimes({
			employeeId: '',
			mon_times: ['08:00'],
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('obrigatório')
	})

	test('returns error for invalid time format (e.g. "25:00")', async () => {
		const result = await updateEmployeeTimes({
			employeeId: 'emp_1',
			mon_times: ['25:00'],
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('HH:MM')
	})

	test('returns error when employee not found (prisma.employee.findUnique returns null)', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue(null)
		const result = await updateEmployeeTimes({
			employeeId: 'emp_unknown',
			mon_times: ['08:00'],
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('não encontrado')
	})

	test('returns error when employee belongs to another user (UserId !== session.id)', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			UserId: 'usr_other',
		})
		const result = await updateEmployeeTimes({
			employeeId: 'emp_1',
			mon_times: ['08:00'],
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('successfully updates times (sorts and deduplicates)', async () => {
		const { revalidatePath } = await import('next/cache')
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			UserId: 'usr_1',
		})
		;(prisma.employee.update as jest.Mock).mockResolvedValue({ id: 'emp_1' })
		const result = await updateEmployeeTimes({
			employeeId: 'emp_1',
			mon_times: ['14:00', '08:00', '10:00'],
		})
		expect(result.success).toBe(true)
		expect(result.message).toContain('sucesso')
		expect(prisma.employee.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'emp_1' },
				data: expect.objectContaining({
					mon_times: ['08:00', '10:00', '14:00'],
				}),
			}),
		)
		expect(revalidatePath).toHaveBeenCalledWith('/dashboard/services/employee')
	})

	test('times are sorted chronologically: ["14:00", "08:00", "10:00"] -> ["08:00", "10:00", "14:00"]', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			UserId: 'usr_1',
		})
		;(prisma.employee.update as jest.Mock).mockResolvedValue({ id: 'emp_1' })
		await updateEmployeeTimes({
			employeeId: 'emp_1',
			mon_times: ['14:00', '08:00', '10:00'],
		})
		const call = (prisma.employee.update as jest.Mock).mock.calls[0][0]
		expect(call.data.mon_times).toEqual(['08:00', '10:00', '14:00'])
	})

	test('duplicates removed: ["08:00", "08:00", "09:00"] -> ["08:00", "09:00"]', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			UserId: 'usr_1',
		})
		;(prisma.employee.update as jest.Mock).mockResolvedValue({ id: 'emp_1' })
		await updateEmployeeTimes({
			employeeId: 'emp_1',
			mon_times: ['08:00', '08:00', '09:00'],
		})
		const call = (prisma.employee.update as jest.Mock).mock.calls[0][0]
		expect(call.data.mon_times).toEqual(['08:00', '09:00'])
	})
})
