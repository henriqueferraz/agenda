/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action createAppointment (painel autenticado).
 * Valida criacao, servico inexistente, funcionario sem servico, feriado,
 * conflito de horario, data passada e empresa diferente.
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

	test('createAppointment cria agendamento', async () => {
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
		;(prisma.appointment.create as jest.Mock).mockResolvedValue({
			id: 'apt_1',
		})
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '23:59',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(true)
	})

	test('createAppointment retorna erro para servico inexistente', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue(null)
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
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
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro para conflito de horario', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		;(prisma.service.findFirst as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			duration: 30,
		})
		;(prisma.employee.findFirst as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			services: [{ serviceId: 'srv_1' }],
		})
		;(prisma.stopDay.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([
			{
				id: 'apt_1',
				time: '10:00',
				appointmentDate: futureDate,
				service: { duration: 30 },
			},
		])
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro para data passada', async () => {
		// Usa data 2 dias no passado para evitar flakiness por timezone
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
			appointmentDate: pastDate,
			time: '00:01',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})

	test('createAppointment retorna erro para empresa diferente', async () => {
		const futureDate = new Date(Date.now() + 60 * 60 * 1000)
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValue({ id: 'usr_2' })
		const result = await createAppointment({
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '(11) 99999-9999',
			appointmentDate: futureDate,
			time: '10:00',
			userId: 'usr_1',
			serviceId: 'srv_1',
			employeeId: 'emp_1',
		})
		expect(result.success).toBe(false)
	})
})
