/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action notifyUnavailability (F-07).
 * Valida notificação com cancelamento, sem cancelamento, sem autenticação,
 * nenhum agendamento encontrado, validação Zod e uso do cancelAppointmentCore.
 *
 * @example
 * npx jest tests/app/actions/notify-unavailability.spec.ts
 */
import prisma from '@/lib/prisma'
import { notifyUnavailability } from '@/app/(panel)/dashboard/services/message/_actions/notify-unavailability'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('@/lib/global-messaging', () => ({
	sendGlobalMessage: jest.fn(async () => undefined),
}))
jest.mock('@/app/_core/appointment-core', () => ({
	cancelAppointmentCore: jest.fn(async () => ({ success: true, data: {} })),
}))

const createMockAppointment = (id: string, phone: string, name: string) => ({
	id,
	userId: 'usr_1',
	clientId: 'cli_1',
	client: {
		id: 'cli_1',
		name,
		email: `${name.toLowerCase()}@test.com`,
		phone,
	},
		appointmentDate: new Date('2026-02-25T03:00:00.000Z'),
		time: '10:00',
		status: 'confirmed',
		managementToken: `mgmt_${id}`,
		service: { name: 'Corte de Cabelo', price: 5000, duration: 30 },
		employee: { name: 'João da Silva' },
})

describe('Server Actions - notifyUnavailability (F-07)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('notifica e cancela agendamentos com sucesso', async () => {
		const appointments = [
			createMockAppointment('apt_1', '5511999990001', 'Maria'),
			createMockAppointment('apt_2', '5511999990002', 'João'),
		]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		const result = await notifyUnavailability({
			appointmentIds: ['apt_1', 'apt_2'],
			reason: 'Indisposição médica',
			message: 'Olá! Infelizmente precisamos cancelar...',
			cancelAppointments: true,
		})

		expect(result.success).toBe(true)
		expect(result.sent).toBe(2)
		expect(result.cancelled).toBe(2)

		const { cancelAppointmentCore } = await import('@/app/_core/appointment-core')
		expect(cancelAppointmentCore).toHaveBeenCalledTimes(2)
	})

	test('notifica sem cancelar quando cancelAppointments é false', async () => {
		const appointments = [
			createMockAppointment('apt_1', '5511999990001', 'Maria'),
		]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		const result = await notifyUnavailability({
			appointmentIds: ['apt_1'],
			reason: 'Feriado',
			message: 'Olá! Estaremos em feriado...',
			cancelAppointments: false,
		})

		expect(result.success).toBe(true)
		expect(result.sent).toBe(1)
		expect(result.cancelled).toBe(0)

		const { cancelAppointmentCore } = await import('@/app/_core/appointment-core')
		expect(cancelAppointmentCore).not.toHaveBeenCalled()
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await notifyUnavailability({
			appointmentIds: ['apt_1'],
			reason: 'Teste',
			message: 'Mensagem',
			cancelAppointments: false,
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('autenticado')
	})

	test('retorna erro quando nenhum agendamento confirmado encontrado', async () => {
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])

		const result = await notifyUnavailability({
			appointmentIds: ['apt_999'],
			reason: 'Teste',
			message: 'Mensagem',
			cancelAppointments: false,
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('Nenhum')
	})

	test('retorna erro para lista de IDs vazia', async () => {
		const result = await notifyUnavailability({
			appointmentIds: [],
			reason: 'Teste',
			message: 'Mensagem',
			cancelAppointments: false,
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})

	test('retorna erro para motivo vazio', async () => {
		const result = await notifyUnavailability({
			appointmentIds: ['apt_1'],
			reason: '',
			message: 'Mensagem',
			cancelAppointments: false,
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})

	test('chama sendGlobalMessage com type unavailability e reason', async () => {
		const { sendGlobalMessage } = await import('@/lib/global-messaging')
		const appointments = [createMockAppointment('apt_1', '5511999990001', 'Maria')]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		await notifyUnavailability({
			appointmentIds: ['apt_1'],
			reason: 'Doença',
			message: 'Aviso de indisponibilidade',
			cancelAppointments: false,
		})

		expect(sendGlobalMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'unavailability',
				reason: 'Doença',
				clientName: 'Maria',
				message: 'Aviso de indisponibilidade',
			}),
		)
	})

	test('faz dedup por telefone nas notificações', async () => {
		const { sendGlobalMessage } = await import('@/lib/global-messaging')
		const appointments = [
			createMockAppointment('apt_1', '5511999990001', 'Maria'),
			createMockAppointment('apt_2', '5511999990001', 'Maria'),
		]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		const result = await notifyUnavailability({
			appointmentIds: ['apt_1', 'apt_2'],
			reason: 'Feriado',
			message: 'Aviso',
			cancelAppointments: true,
		})

		expect(result.sent).toBe(1)
		expect(result.cancelled).toBe(2)
		expect(sendGlobalMessage).toHaveBeenCalledTimes(1)
	})

	test('revalidatePath é chamado após envio', async () => {
		const { revalidatePath } = await import('next/cache')
		const appointments = [createMockAppointment('apt_1', '5511999990001', 'Maria')]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		await notifyUnavailability({
			appointmentIds: ['apt_1'],
			reason: 'Teste',
			message: 'Mensagem',
			cancelAppointments: false,
		})

		expect(revalidatePath).toHaveBeenCalledWith('/dashboard/schedule/calendar')
	})
})
