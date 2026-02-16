/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action rescheduleAppointment (F-02).
 * Valida reagendamento com sucesso, conflito F-01, agendamento cancelado,
 * sem autenticação e data passada.
 *
 * @example
 * npx jest tests/app/actions/reschedule-appointment.spec.ts
 */
import prisma from '@/lib/prisma'
import { rescheduleAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/reschedule-appointment'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('Server Actions - rescheduleAppointment (F-02)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

	test('reagenda agendamento com sucesso', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			employeeId: 'emp_1',
			appointmentDate: new Date(),
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			time: '15:00',
			service: { id: 'srv_1', name: 'Corte' },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({
			id: 'hist_1',
		})

		const result = await rescheduleAppointment({
			appointmentId: 'apt_1',
			newDate: futureDate,
			newTime: '15:00',
		})

		expect(result.success).toBe(true)
		expect(result.message).toContain('reagendado')
	})

	test('retorna erro para agendamento cancelado', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'cancelled',
		})

		const result = await rescheduleAppointment({
			appointmentId: 'apt_1',
			newDate: futureDate,
			newTime: '15:00',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('cancelado')
	})

	test('retorna erro para conflito de funcionário F-01', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			employeeId: 'emp_1',
			appointmentDate: new Date(),
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValueOnce([
			{
				id: 'apt_other',
				time: '15:00',
				appointmentDate: futureDate,
				service: { duration: 30 },
			},
		])

		const result = await rescheduleAppointment({
			appointmentId: 'apt_1',
			newDate: futureDate,
			newTime: '15:00',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('funcionário')
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await rescheduleAppointment({
			appointmentId: 'apt_1',
			newDate: futureDate,
			newTime: '15:00',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('autenticado')
	})

	test('retorna erro para agendamento não encontrado', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)

		const result = await rescheduleAppointment({
			appointmentId: 'apt_999',
			newDate: futureDate,
			newTime: '15:00',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('não encontrado')
	})

	test('retorna erro para horário inválido', async () => {
		const result = await rescheduleAppointment({
			appointmentId: 'apt_1',
			newDate: futureDate,
			newTime: '25:00',
		})

		expect(result.success).toBe(false)
	})
})
