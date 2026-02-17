/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action updateAppointment (F-02).
 * Valida edição com sucesso, serviço inexistente, conflito F-01,
 * agendamento cancelado e sem autenticação.
 *
 * @example
 * npx jest tests/app/actions/update-appointment.spec.ts
 */
import prisma from '@/lib/prisma'
import { updateAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/update-appointment'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('@/lib/webhook-notify', () => ({
	sendAppointmentWebhook: jest.fn(async () => undefined),
}))

describe('Server Actions - updateAppointment (F-02)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

	test('atualiza serviço com sucesso', async () => {
		// Primeira chamada: captura dados antigos para webhook
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValueOnce({
			appointmentDate: futureDate,
			time: '10:00',
		})
		// Segunda chamada: core busca agendamento completo
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
			appointmentDate: futureDate,
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_2',
			name: 'Barba',
			duration: 20,
			status: true,
			UserId: 'usr_1',
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			serviceId: 'srv_2',
			service: { id: 'srv_2', name: 'Barba' },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({
			id: 'hist_1',
		})

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Troca de serviço',
			serviceId: 'srv_2',
		})

		expect(result.success).toBe(true)
		expect(result.message).toContain('atualizado')
	})

	test('retorna erro para agendamento cancelado', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'cancelled',
		})

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Teste cancelado',
			serviceId: 'srv_2',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('cancelado')
	})

	test('retorna erro para serviço inexistente', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
			appointmentDate: futureDate,
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue(null)

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Teste serviço inexistente',
			serviceId: 'srv_999',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('Serviço')
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Teste sem auth',
			serviceId: 'srv_2',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('autenticado')
	})

	test('retorna erro para nenhuma alteração', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
			appointmentDate: futureDate,
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Teste sem alteração',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('alteração')
	})

	test('chama webhook com oldDate, oldTime e dados do agendamento atualizado', async () => {
		const { sendAppointmentWebhook } = await import('@/lib/webhook-notify')
		const mockWebhook = sendAppointmentWebhook as jest.Mock

		// Primeira chamada: captura dados antigos para webhook
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValueOnce({
			appointmentDate: futureDate,
			time: '10:00',
		})
		// Segunda chamada: core busca agendamento completo
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
			appointmentDate: futureDate,
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			id: 'apt_1',
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '11999999999',
			appointmentDate: futureDate,
			time: '15:00',
			service: { id: 'srv_1', name: 'Corte', price: 5000, duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({
			id: 'hist_1',
		})

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Troca de horário',
			time: '15:00',
		})

		expect(result.success).toBe(true)
		expect(mockWebhook).toHaveBeenCalledTimes(1)
		const webhookArgs = mockWebhook.mock.calls[0][0]
		expect(webhookArgs.type).toBe('edit')
		expect(webhookArgs.oldTime).toBe('10:00')
		expect(webhookArgs.oldDate).toBeDefined()
		expect(webhookArgs.changeReason).toBe('Troca de horário')
	})

	test('retorna erro para conflito F-01 de funcionário', async () => {
		// Primeira chamada: captura dados antigos para webhook
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValueOnce({
			appointmentDate: futureDate,
			time: '10:00',
		})
		// Segunda chamada: core busca agendamento completo
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValueOnce({
			id: 'apt_1',
			userId: 'usr_1',
			status: 'confirmed',
			email: 'cliente@teste.com',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
			appointmentDate: futureDate,
			time: '10:00',
			service: { id: 'srv_1', name: 'Corte', duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
		})
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValueOnce([
			{
				id: 'apt_other',
				time: '14:00',
				appointmentDate: futureDate,
				service: { duration: 60 },
			},
		])

		const result = await updateAppointment({
			appointmentId: 'apt_1',
			reason: 'Teste conflito F-01',
			time: '14:30',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('funcionário')
	})
})
