/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action cancelAppointment (F-02).
 * Valida cancelamento com sucesso, já cancelado, agendamento não encontrado,
 * sem autenticação e motivo opcional.
 *
 * @example
 * npx jest tests/app/actions/cancel-appointment.spec.ts
 */
import prisma from '@/lib/prisma'
import { cancelAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/cancel-appointment'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('@/lib/webhook-notify', () => ({
	sendAppointmentWebhook: jest.fn(async () => undefined),
}))

describe('Server Actions - cancelAppointment (F-02)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('cancela agendamento com sucesso', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			status: 'cancelled',
			cancelReason: 'Cliente desistiu',
			service: { id: 'srv_1', name: 'Corte' },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({
			id: 'hist_1',
		})

		const result = await cancelAppointment({
			appointmentId: 'apt_1',
			reason: 'Cliente desistiu',
		})

		expect(result.success).toBe(true)
		expect(result.message).toContain('cancelado')
	})

	test('retorna erro para agendamento já cancelado', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'cancelled',
		})

		const result = await cancelAppointment({ appointmentId: 'apt_1' })

		expect(result.success).toBe(false)
		expect(result.error).toContain('já foi cancelado')
	})

	test('retorna erro para agendamento não encontrado', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)

		const result = await cancelAppointment({ appointmentId: 'apt_999' })

		expect(result.success).toBe(false)
		expect(result.error).toContain('não encontrado')
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await cancelAppointment({ appointmentId: 'apt_1' })

		expect(result.success).toBe(false)
		expect(result.error).toContain('autenticado')
	})

	test('cancela com sucesso sem motivo', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			status: 'cancelled',
			cancelReason: null,
			service: { id: 'srv_1', name: 'Corte' },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({
			id: 'hist_1',
		})

		const result = await cancelAppointment({ appointmentId: 'apt_1' })

		expect(result.success).toBe(true)
	})

	test('retorna erro para appointmentId vazio', async () => {
		const result = await cancelAppointment({ appointmentId: '' })

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})
})
