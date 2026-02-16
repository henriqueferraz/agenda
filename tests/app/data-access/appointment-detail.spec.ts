/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes do data-access getAppointmentById (F-02).
 * Valida busca por ID, propriedade, autenticação e tratamento de erros.
 *
 * @example
 * npx jest tests/app/data-access/appointment-detail.spec.ts
 */
import prisma from '@/lib/prisma'
import { getAppointmentById } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-appointment-by-id'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

describe('Data Access - getAppointmentById (F-02)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('retorna agendamento com serviço, funcionário e histórico', async () => {
		const mockAppointment = {
			id: 'apt_1',
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '11999999999',
			time: '10:00',
			status: 'confirmed',
			appointmentDate: new Date(),
			userId: 'usr_1',
			service: { id: 'srv_1', name: 'Corte', price: 5000, duration: 30 },
			employee: { id: 'emp_1', name: 'João' },
			history: [
				{
					id: 'hist_1',
					action: 'created',
					performedBy: 'system',
					changes: null,
					reason: null,
					createdAt: new Date(),
				},
			],
		}
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(
			mockAppointment,
		)

		const result = await getAppointmentById({
			appointmentId: 'apt_1',
			userId: 'usr_1',
		})

		expect(result).not.toBeNull()
		expect(result?.id).toBe('apt_1')
		expect(result?.service.name).toBe('Corte')
		expect(result?.history).toHaveLength(1)
	})

	test('retorna null quando userId não corresponde', async () => {
		const result = await getAppointmentById({
			appointmentId: 'apt_1',
			userId: 'usr_other',
		})

		expect(result).toBeNull()
	})

	test('retorna null sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await getAppointmentById({
			appointmentId: 'apt_1',
			userId: 'usr_1',
		})

		expect(result).toBeNull()
	})

	test('retorna null quando agendamento não existe', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null)

		const result = await getAppointmentById({
			appointmentId: 'apt_999',
			userId: 'usr_1',
		})

		expect(result).toBeNull()
	})

	test('retorna null para appointmentId vazio', async () => {
		const result = await getAppointmentById({
			appointmentId: '',
			userId: 'usr_1',
		})

		expect(result).toBeNull()
	})

	test('retorna null em caso de erro Prisma', async () => {
		;(prisma.appointment.findFirst as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		const result = await getAppointmentById({
			appointmentId: 'apt_1',
			userId: 'usr_1',
		})

		expect(result).toBeNull()
	})
})
