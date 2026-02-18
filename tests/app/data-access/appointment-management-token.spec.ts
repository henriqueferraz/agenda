/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Testes do data-access getAppointmentByManagementToken (F-08).
 * Valida busca por token: sucesso, não encontrado, cancelado, expirado.
 *
 * @example
 * npx jest tests/app/data-access/appointment-management-token.spec.ts
 */
import prisma from '@/lib/prisma'
import { getAppointmentByManagementToken } from '@/app/(public)/agendamento/gerenciar/[managementToken]/_data-access/get-appointment-by-management-token'

const futureDate = new Date()
futureDate.setDate(futureDate.getDate() + 7)
const futureDateNormalized = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate())

const mockAppointment = {
	id: 'apt_1',
	name: 'Henrique Ferraz',
	email: 'henriqueferraz@ofnet.com.br',
	phone: '5547988271299',
	appointmentDate: futureDateNormalized,
	time: '14:00',
	status: 'confirmed',
	managementToken: 'a'.repeat(64),
	userId: 'usr_1',
	service: { id: 'srv_1', name: 'Corte de Cabelo', price: 4200, duration: 45 },
	employee: { id: 'emp_1', name: 'João', phone: '5511999999999' },
	user: {
		id: 'usr_1',
		name: 'Empresa',
		be_called: 'Barbearia',
		phone: '5511888888888',
		email: 'empresa@test.com',
		token_called: 'token-123',
	},
}

describe('Data Access - getAppointmentByManagementToken (F-08)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('retorna agendamento válido com sucesso', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.address.findUnique as jest.Mock).mockResolvedValue({
			street: 'Rua Teste',
			number: '123',
			complement: '',
			neighborhood: 'Centro',
			city: 'Joinville',
			state: 'SC',
			zip_code: '89200-000',
		})

		const result = await getAppointmentByManagementToken({
			managementToken: 'a'.repeat(64),
		})

		expect(result.appointment).not.toBeNull()
		expect(result.appointment?.id).toBe('apt_1')
		expect(result.appointment?.service.name).toBe('Corte de Cabelo')
		expect(result.appointment?.address?.city).toBe('Joinville')
		expect(result.error).toBeUndefined()
	})

	test('retorna not_found para token inexistente', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await getAppointmentByManagementToken({
			managementToken: 'b'.repeat(64),
		})

		expect(result.appointment).toBeNull()
		expect(result.error).toBe('not_found')
	})

	test('retorna cancelled para agendamento cancelado', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
			...mockAppointment,
			status: 'cancelled',
		})

		const result = await getAppointmentByManagementToken({
			managementToken: 'a'.repeat(64),
		})

		expect(result.appointment).toBeNull()
		expect(result.error).toBe('cancelled')
	})

	test('retorna expired para agendamento passado', async () => {
		const pastDate = new Date()
		pastDate.setDate(pastDate.getDate() - 3)

		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
			...mockAppointment,
			appointmentDate: pastDate,
			time: '08:00',
		})

		const result = await getAppointmentByManagementToken({
			managementToken: 'a'.repeat(64),
		})

		expect(result.appointment).toBeNull()
		expect(result.error).toBe('expired')
	})

	test('retorna not_found para token muito curto', async () => {
		const result = await getAppointmentByManagementToken({
			managementToken: 'abc',
		})

		expect(result.appointment).toBeNull()
		expect(result.error).toBe('not_found')
	})

	test('retorna not_found para token vazio', async () => {
		const result = await getAppointmentByManagementToken({
			managementToken: '',
		})

		expect(result.appointment).toBeNull()
		expect(result.error).toBe('not_found')
	})

	test('retorna agendamento sem endereço (address null)', async () => {
		;(prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment)
		;(prisma.address.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await getAppointmentByManagementToken({
			managementToken: 'a'.repeat(64),
		})

		expect(result.appointment).not.toBeNull()
		expect(result.appointment?.address).toBeNull()
	})
})
