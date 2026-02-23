/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Testes das server actions createBlockedTime e deleteBlockedTime.
 * Valida criação com sucesso, duplicidade, agendamento existente, propriedade
 * de funcionário, autenticação e exclusão.
 *
 * @example
 * npx jest tests/app/actions/blocked-times.spec.ts
 */
import prisma from '@/lib/prisma'
import { createBlockedTime } from '@/app/(panel)/dashboard/schedule/blocked-time/_actions/create-blocked-time'
import { deleteBlockedTime } from '@/app/(panel)/dashboard/schedule/blocked-time/_actions/delete-blocked-time'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('Server Actions - BlockedTimes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('createBlockedTime cria bloqueio com sucesso', async () => {
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			UserId: 'usr_1',
		})
		;(prisma.blockedTime.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.blockedTime.create as jest.Mock).mockResolvedValue({
			id: 'bt_1',
			time: '14:00',
		})
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: '14:00',
			motivation: 'Consulta médica',
			employeeId: 'emp_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(true)
		expect(result.message).toBe('Bloqueio criado com sucesso!')
	})

	test('createBlockedTime retorna erro para bloqueio duplicado', async () => {
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			UserId: 'usr_1',
		})
		;(prisma.blockedTime.findFirst as jest.Mock).mockResolvedValue({
			id: 'bt_1',
		})
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: '14:00',
			motivation: 'Duplicado',
			employeeId: 'emp_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('Já existe um bloqueio')
	})

	test('createBlockedTime retorna erro se agendamento confirmado no horário', async () => {
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			UserId: 'usr_1',
		})
		;(prisma.blockedTime.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			status: 'confirmed',
		})
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: '14:00',
			motivation: 'Bloqueio',
			employeeId: 'emp_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('agendamento confirmado')
	})

	test('createBlockedTime retorna erro para funcionário inexistente', async () => {
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue(null)
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: '14:00',
			motivation: 'Bloqueio',
			employeeId: 'emp_inexistente',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('Funcionário não encontrado')
	})

	test('createBlockedTime retorna erro para outro usuário', async () => {
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: '14:00',
			motivation: 'Bloqueio',
			employeeId: 'emp_1',
			userId: 'usr_outro',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('createBlockedTime retorna erro sem autenticação', async () => {
		const { getUserFromToken } = jest.requireMock('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: '14:00',
			motivation: 'Bloqueio',
			employeeId: 'emp_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('Não autenticado')
	})

	test('createBlockedTime retorna erro para dados inválidos (Zod)', async () => {
		const result = await createBlockedTime({
			date: new Date('2026-03-01'),
			time: 'invalido',
			motivation: 'OK',
			employeeId: 'emp_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('HH:MM')
	})

	test('deleteBlockedTime remove bloqueio com sucesso', async () => {
		;(prisma.blockedTime.findFirst as jest.Mock).mockResolvedValue({
			id: 'bt_1',
			UserId: 'usr_1',
		})
		;(prisma.blockedTime.delete as jest.Mock).mockResolvedValue({ id: 'bt_1' })
		const result = await deleteBlockedTime({
			id: 'bt_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(true)
		expect(result.message).toBe('Bloqueio removido com sucesso!')
	})

	test('deleteBlockedTime retorna erro para bloqueio inexistente', async () => {
		;(prisma.blockedTime.findFirst as jest.Mock).mockResolvedValue(null)
		const result = await deleteBlockedTime({
			id: 'bt_inexistente',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('não encontrado')
	})

	test('deleteBlockedTime retorna erro para outro usuário', async () => {
		const result = await deleteBlockedTime({
			id: 'bt_1',
			userId: 'usr_outro',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('deleteBlockedTime retorna erro sem autenticação', async () => {
		const { getUserFromToken } = jest.requireMock('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)
		const result = await deleteBlockedTime({
			id: 'bt_1',
			userId: 'usr_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('Não autenticado')
	})
})
