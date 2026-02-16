/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes dos data-access do dashboard (estatisticas, novos agendamentos, lembretes).
 * Valida fluxos de sucesso, erros de autenticacao e falhas de banco.
 */
import prisma from '@/lib/prisma'
import { getNewAppointments } from '@/app/(panel)/dashboard/dashboard/_data-access/get-new-appointments'
import { getReminders } from '@/app/(panel)/dashboard/dashboard/_data-access/get-reminders'
import { getInfoDashboard } from '@/app/(panel)/dashboard/dashboard/_data-access/get-info-dashboard'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
describe('Data Access - Dashboard', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('getNewAppointments retorna lista vazia sem userId', async () => {
		const result = await getNewAppointments({ userId: '' })
		expect(result).toEqual([])
	})
	test('getNewAppointments retorna vazio quando prisma falha', async () => {
		; (prisma.appointment.findMany as jest.Mock).mockRejectedValue(
			new Error('db down'),
		)
		const result = await getNewAppointments({ userId: 'usr_1' })
		expect(result).toEqual([])
	})
	test('getNewAppointments mapeia resultados', async () => {
		; (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
			{
				id: 'apt_1',
				name: 'Cliente',
				email: 'cliente@teste.com',
				phone: '(11) 99999-9999',
				appointmentDate: new Date(),
				time: '10:00',
				service: { id: 'srv_1', name: 'Corte' },
				employee: { id: 'emp_1', name: 'Funcionario' },
				createdAt: new Date(),
			},
		])
		const result = await getNewAppointments({ userId: 'usr_1' })
		expect(result.length).toBe(1)
		expect(result[0].service.name).toBe('Corte')
	})
	test('getReminders retorna lista vazia sem userId', async () => {
		const result = await getReminders({ userId: '' })
		expect(result).toEqual([])
	})
	test('getInfoDashboard retorna estatisticas', async () => {
		; (prisma.appointment.count as jest.Mock)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(2)
			; (prisma.appointment.groupBy as jest.Mock).mockResolvedValue([
				{ _count: { email: 5 } },
			])
			; (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
				{ service: { price: 1000 } },
				{ service: { price: 2000 } },
			])
			; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
				mon_times: ['08:00', '09:00'],
				tue_times: [],
				wed_times: [],
				thu_times: [],
				fri_times: [],
				sat_times: [],
				sun_times: [],
			})
		const result = await getInfoDashboard({ userId: 'usr_1' })
		expect(result.appointmentsToday).toBe(3)
		expect(result.monthlyRevenue).toBeGreaterThan(0)
	})
})
