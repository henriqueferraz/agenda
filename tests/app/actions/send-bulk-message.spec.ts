/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action sendBulkMessage (F-07).
 * Valida envio com sucesso, dedup por telefone, sem autenticação,
 * nenhum agendamento encontrado e validação Zod.
 *
 * @example
 * npx jest tests/app/actions/send-bulk-message.spec.ts
 */
import prisma from '@/lib/prisma'
import { sendBulkMessage } from '@/app/(panel)/dashboard/services/message/_actions/send-bulk-message'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('@/lib/global-messaging', () => ({
	sendGlobalMessage: jest.fn(async () => undefined),
}))

const createMockAppointment = (id: string, phone: string, name: string) => ({
	id,
	userId: 'usr_1',
	clientId: 'cli_1',
	client: {
		id: 'cli_1',
		name,
		email: `${name.toLowerCase().replace(' ', '.')}@test.com`,
		phone,
	},
		appointmentDate: new Date('2026-02-25T03:00:00.000Z'),
		time: '10:00',
		managementToken: `mgmt_${id}`,
		service: { name: 'Corte de Cabelo', price: 5000, duration: 30 },
		employee: { name: 'João da Silva' },
})

describe('Server Actions - sendBulkMessage (F-07)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('envia mensagem em massa com sucesso', async () => {
		const appointments = [
			createMockAppointment('apt_1', '5511999990001', 'Maria'),
			createMockAppointment('apt_2', '5511999990002', 'João'),
		]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		const result = await sendBulkMessage({
			appointmentIds: ['apt_1', 'apt_2'],
			message: 'Aviso importante para todos!',
		})

		expect(result.success).toBe(true)
		expect(result.sent).toBe(2)
		expect(result.total).toBe(2)
		expect(prisma.messageLog.create).toHaveBeenCalledTimes(2)
	})

	test('faz dedup por telefone — mesmo telefone recebe 1 mensagem', async () => {
		const appointments = [
			createMockAppointment('apt_1', '5511999990001', 'Maria'),
			createMockAppointment('apt_2', '5511999990001', 'Maria'),
		]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		const { sendGlobalMessage } = await import('@/lib/global-messaging')

		const result = await sendBulkMessage({
			appointmentIds: ['apt_1', 'apt_2'],
			message: 'Aviso!',
		})

		expect(result.success).toBe(true)
		expect(result.sent).toBe(1)
		expect(sendGlobalMessage).toHaveBeenCalledTimes(1)
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await sendBulkMessage({
			appointmentIds: ['apt_1'],
			message: 'Aviso!',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('autenticado')
	})

	test('retorna erro quando nenhum agendamento encontrado', async () => {
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])

		const result = await sendBulkMessage({
			appointmentIds: ['apt_999'],
			message: 'Aviso!',
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('Nenhum')
	})

	test('retorna erro para lista de IDs vazia', async () => {
		const result = await sendBulkMessage({
			appointmentIds: [],
			message: 'Aviso!',
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})

	test('retorna erro para mensagem vazia', async () => {
		const result = await sendBulkMessage({
			appointmentIds: ['apt_1'],
			message: '',
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeDefined()
	})

	test('chama sendGlobalMessage com type custom_bulk', async () => {
		const { sendGlobalMessage } = await import('@/lib/global-messaging')
		const appointments = [createMockAppointment('apt_1', '5511999990001', 'Maria')]
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(appointments)
		;(prisma.messageLog.create as jest.Mock).mockResolvedValue({ id: 'msg_1' })

		await sendBulkMessage({
			appointmentIds: ['apt_1'],
			message: 'Teste massa',
		})

		expect(sendGlobalMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'custom_bulk',
				clientName: 'Maria',
				message: 'Teste massa',
			}),
		)
	})
})
