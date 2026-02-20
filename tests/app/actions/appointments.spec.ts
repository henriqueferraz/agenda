/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action createAppointment (painel autenticado).
 * Valida criacao com find-or-create Client (F-10), servico inexistente, funcionario
 * sem servico, feriado, conflito de horario do funcionario, conflito de horario do
 * cliente (F-01), data passada, empresa diferente e permissao quando existe cancelado.
 *
 * @example
 * npx jest tests/app/actions/appointments.spec.ts
 */
import prisma from '@/lib/prisma'
import { createAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/create-appointment'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('Server Actions - Appointments', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('createAppointment cria agendamento com find-or-create Client (F-10)', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.client.create as jest.Mock).mockResolvedValue({ id: 'cli_1' })
		;(prisma.appointment.create as jest.Mock).mockResolvedValue({
			id: 'apt_1',
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '23:59',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(true)
	})

	test('createAppointment reutiliza Client existente quando CPF ja cadastrado', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue({ id: 'cli_existing' })
		;(prisma.appointment.create as jest.Mock).mockResolvedValue({
			id: 'apt_1',
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '23:59',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(true)
		expect(prisma.client.create).not.toHaveBeenCalled()
	})

	test('createAppointment retorna erro para servico inexistente', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue(null)
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro quando funcionario nao faz servico', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [],
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro para feriado', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue({
			motivation: 'Feriado',
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro para conflito de horario do funcionario', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue({ id: 'cli_1' })
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([
			{
				id: 'apt_1',
				time: '23:59',
				appointmentDate: futureDate,
				service: { duration: 30 },
			},
		])
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '23:59',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('funcionário já tem um agendamento')
	})

	test('createAppointment retorna erro para sobreposicao de horario do cliente (F-01)', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 20,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_2',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue({ id: 'cli_1' })
		;(prisma.appointment.findMany as jest.Mock)
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([
				{
					id: 'apt_existing',
					time: '23:30',
					appointmentDate: futureDate,
					service: { duration: 30 },
				},
			])
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '23:45',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_2',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('cliente já possui um agendamento')
	})

	test('createAppointment retorna erro para data passada', async () => {
		const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: pastDate,
			time: '00:01',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment permite agendar quando existe agendamento cancelado no mesmo horario', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.client.create as jest.Mock).mockResolvedValue({ id: 'cli_1' })
		;(prisma.appointment.create as jest.Mock).mockResolvedValue({
			id: 'apt_new',
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '23:59',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(true)
		const findManyCalls = (prisma.appointment.findMany as jest.Mock).mock.calls
		findManyCalls.forEach((call: Array<{ where?: { status?: string } }>) => {
			expect(call[0]?.where?.status).toBe('confirmed')
		})
	})

	test('createAppointment retorna erro para empresa diferente', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValue({ id: 'usr_2' })
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '52998224725',
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro para CPF invalido', async () => {
		const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			cpf: '11111111111',
			appointmentDate: futureDate,
			time: '23:59',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('CPF inválido')
	})
})
