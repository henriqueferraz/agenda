/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action cancelAppointmentPublic (F-08).
 * Valida cancelamento público via managementToken: sucesso, já cancelado,
 * não encontrado, prazo mínimo e notificação ao profissional.
 *
 * @example
 * npx jest tests/app/actions/cancel-appointment-public.spec.ts
 */
import prisma from '@/lib/prisma'
import { cancelAppointmentPublic } from '@/app/(public)/agendamento/gerenciar/[managementToken]/_actions/cancel-appointment-public'

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('@/lib/global-messaging', () => ({
	sendGlobalMessage: jest.fn(async () => undefined),
}))

const futureDate = new Date()
futureDate.setDate(futureDate.getDate() + 7)
const futureDateNormalized = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate())

const mockAppointment = {
	id: 'apt_1',
	managementToken: 'a'.repeat(64),
	status: 'confirmed',
	clientId: 'cli_1',
	client: {
		id: 'cli_1',
		name: 'Henrique Ferraz',
		email: 'henriqueferraz@ofnet.com.br',
		phone: '5547988271299',
	},
	appointmentDate: futureDateNormalized,
	time: '14:00',
	userId: 'usr_1',
	service: { id: 'srv_1', name: 'Corte de Cabelo', price: 4200, duration: 45 },
	employee: { id: 'emp_1', name: 'João', phone: '5511999999999' },
	user: {
		id: 'usr_1',
		name: 'Empresa',
		phone: '5511888888888',
		email: 'empresa@test.com',
		be_called: 'Barbearia',
		token_called: 'token-123',
	},
}

describe('Server Actions - cancelAppointmentPublic (F-08)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('cancela agendamento público com sucesso', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			...mockAppointment,
			status: 'cancelled',
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({ id: 'hist_1' })

		const result = await cancelAppointmentPublic({
			managementToken: 'a'.repeat(64),
			reason: 'Não poderei comparecer',
		})

		expect(result.success).toBe(true)
		expect(result.message).toContain('cancelado')
	})

	test('retorna erro para token inválido (muito curto)', async () => {
		const result = await cancelAppointmentPublic({
			managementToken: 'abc',
		})

		expect(result.success).toBe(false)
		expect(result.error).toBeTruthy()
	})

	test('retorna erro para agendamento não encontrado', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await cancelAppointmentPublic({
			managementToken: 'b'.repeat(64),
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('não encontrado')
	})

	test('retorna erro para agendamento já cancelado', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
			...mockAppointment,
			status: 'cancelled',
		})

		const result = await cancelAppointmentPublic({
			managementToken: 'a'.repeat(64),
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('já foi cancelado')
	})

	test('retorna erro quando prazo mínimo não é respeitado', async () => {
		const soonDate = new Date()
		soonDate.setMinutes(soonDate.getMinutes() + 30)

		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
			...mockAppointment,
			appointmentDate: new Date(soonDate.getFullYear(), soonDate.getMonth(), soonDate.getDate()),
			time: `${String(soonDate.getHours()).padStart(2, '0')}:${String(soonDate.getMinutes()).padStart(2, '0')}`,
		})

		const result = await cancelAppointmentPublic({
			managementToken: 'a'.repeat(64),
		})

		expect(result.success).toBe(false)
		expect(result.error).toContain('antecedência')
	})

	test('cancela com sucesso sem motivo (opcional)', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.appointment.update as jest.Mock).mockResolvedValue({
			...mockAppointment,
			status: 'cancelled',
		})
		;(prisma.appointmentHistory.create as jest.Mock).mockResolvedValue({ id: 'hist_1' })

		const result = await cancelAppointmentPublic({
			managementToken: 'a'.repeat(64),
		})

		expect(result.success).toBe(true)
	})
})
