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
 * Valida criacao publica de agendamentos (sem login), token invalido e
 * funcionario sem servico. A criacao usa prisma.$transaction atomica.
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
		// Mocks usados dentro de $transaction (mesmo proxy do prismaMock)
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null) // sem duplicata
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

	test('createPublicAppointment bloqueia agendamento duplicado por email', async () => {
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
		// Simula que já existe agendamento com mesmo email no mesmo horário
		;(prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
			id: 'apt_existing',
			email: 'cliente@teste.com',
			time: '23:59',
		})
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
		expect(result.success).toBe(false)
		expect(result.error).toContain('já possui um agendamento')
		expect(prisma.appointment.create).not.toHaveBeenCalled()
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
