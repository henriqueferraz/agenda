/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action sendIndividualMessage (F-07).
 * Valida envio com sucesso, sem autenticação, agendamento não encontrado,
 * validação Zod e registro no MessageLog.
 *
 * @example
 * npx jest tests/app/actions/send-individual-message.spec.ts
 */
import prisma from '@/lib/prisma'
import { sendIndividualMessage } from '@/app/(panel)/dashboard/services/message/_actions/send-individual-message'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('@/lib/global-messaging', () => ({
	sendGlobalMessage: jest.fn(async () => undefined),
}))

const mockAppointment = {
	id: 'apt_1',
	userId: 'usr_1',
	clientId: 'cli_1',
	client: {
		id: 'cli_1',
		name: 'Maria Silva',
		email: 'maria@test.com',
		phone: '5511999990000',
	},
	appointmentDate: new Date('2026-02-25T03:00:00.000Z'),
	time: '10:00',
	managementToken: 'mgmt_token_123',
	service: { name: 'Corte de Cabelo', price: 5000, duration: 30 },
	employee: { name: 'João da Silva' },
}

describe('Server Actions - sendIndividualMessage (F-07)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('envia mensagem individual com sucesso', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		const result = await sendIndividualMessage({
			appointmentId: 'apt_1',
			message: 'Olá Maria! Sobre seu agendamento...',
		})

		expect(result.success).toBe(true)
		expect(result.message).toContain('Maria Silva')

		expect(prisma.messageLog.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				userId: 'usr_1',
				type: 'custom_individual',
				recipientName: 'Maria Silva',
				recipientPhone: '5511999990000',
				status: 'sent',
			}),
		})
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await sendIndividualMessage({
			appointmentId: 'apt_1',
			message: 'Olá!',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('autenticado')
	})

	test('retorna erro para agendamento não encontrado', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)

		const result = await sendIndividualMessage({
			appointmentId: 'apt_999',
			message: 'Olá!',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('não encontrado')
	})

	test('retorna erro para mensagem vazia', async () => {
		const result = await sendIndividualMessage({
			appointmentId: 'apt_1',
			message: '',
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})

	test('retorna erro para appointmentId vazio', async () => {
		const result = await sendIndividualMessage({
			appointmentId: '',
			message: 'Olá!',
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})

	test('chama sendGlobalMessage com type custom_individual', async () => {
		const { sendGlobalMessage } = await import('@/lib/global-messaging')
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		await sendIndividualMessage({
			appointmentId: 'apt_1',
			message: 'Mensagem teste',
		})

		expect(sendGlobalMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'custom_individual',
				clientName: 'Maria Silva',
				clientPhone: '5511999990000',
				message: 'Mensagem teste',
			}),
		)
	})
})
