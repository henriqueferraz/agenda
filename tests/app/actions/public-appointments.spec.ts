/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action createPublicAppointment.
 * Valida criacao publica de agendamentos (sem login), token invalido,
 * funcionario sem servico, conflito de horario do cliente (F-01)
 * e permissao de agendamento quando existe cancelado.
 * A criacao usa prisma.$transaction atomica.
 *
 * @example
 * npx jest tests/app/actions/public-appointments.spec.ts
 */
import prisma from '@/lib/prisma'
import { createPublicAppointment } from '@/app/(public)/agendamento/[token]/_actions/create-public-appointment'

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('Server Actions - Public Appointments', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('createPublicAppointment cria agendamento publico', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		// Mocks dentro de $transaction: sem conflitos de funcionário nem de cliente
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.appointment.create as jest.Mock).mockResolvedValue({ id: 'apt_1' })
		const result = await createPublicAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '23:59',
			token: 'token-empresa',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(true)
	})

	test('createPublicAppointment bloqueia sobreposicao de horario do cliente (F-01)', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 20,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_2',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		// 1ª chamada findMany (funcionário emp_2): sem conflito
		// 2ª chamada findMany (cliente por email): conflito — 23:30+30min sobrepõe com 23:45
		;(prisma.appointment.findMany as jest.Mock)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([
				{
					id: 'apt_existing',
					email: 'cliente@teste.com',
					time: '23:30',
					appointmentDate: futureDate,
					service: { duration: 30 },
				},
			])
		const result = await createPublicAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '23:45',
			token: 'token-empresa',
			serviceId: 'srv_1',
			employeeId: 'emp_2',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('já possui um agendamento')
		expect(prisma.appointment.create).not.toHaveBeenCalled()
	})

	test('createPublicAppointment permite agendar quando existe agendamento cancelado no mesmo horario', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		// Queries de conflito retornam vazio — agendamentos cancelados foram filtrados por status: 'confirmed'
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.appointment.create as jest.Mock).mockResolvedValue({ id: 'apt_new' })
		const result = await createPublicAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '23:59',
			token: 'token-empresa',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(true)
		// Verifica que findMany foi chamado com filtro status: 'confirmed'
		const findManyCalls = (prisma.appointment.findMany as jest.Mock).mock.calls
		findManyCalls.forEach((call: Array<{ where?: { status?: string } }>) => {
			expect(call[0]?.where?.status).toBe('confirmed')
		})
	})

	test('createPublicAppointment retorna erro para token invalido', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		const result = await createPublicAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '10:00',
			token: 'token-invalido',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createPublicAppointment retorna erro para funcionario sem servico', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [],
		})
		const result = await createPublicAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '10:00',
			token: 'token-empresa',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})
})
