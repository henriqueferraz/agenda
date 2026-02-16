/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes das server actions de servicos (criar, atualizar, deletar).
 * Valida fluxos de sucesso, dados invalidos, propriedade e falhas de banco.
 */
import prisma from '@/lib/prisma'
import { createService } from '@/app/(panel)/dashboard/services/service/_actions/create-service'
import { updateService } from '@/app/(panel)/dashboard/services/service/_actions/update-service'
import { deleteService } from '@/app/(panel)/dashboard/services/service/_actions/delete-service'
jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('REDIRECT')
	}),
}))
describe('Server Actions - Services', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('createService cria servico com sucesso', async () => {
		; (prisma.service.create as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			name: 'Corte',
			price: 3000,
			duration: 30,
			status: true,
			createdAt: new Date(),
		})
		const result = await createService({
			name: 'Corte',
			price: 3000,
			duration: 30,
		})
		expect(result.success).toBe(true)
	})
	test('createService retorna erro para dados invalidos', async () => {
		const result = await createService({
			name: 'A',
			price: 0,
			duration: 0,
		})
		expect(result.success).toBe(false)
	})
	test('updateService atualiza servico', async () => {
		; (prisma.service.findUnique as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			UserId: 'usr_1',
		})
			; (prisma.service.update as jest.Mock).mockResolvedValue({ id: 'srv_1' })
		const result = await updateService({
			id: 'srv_1',
			name: 'Corte',
			price: 3000,
			duration: 30,
		})
		expect(result.success).toBe(true)
	})
	test('deleteService soft-deleta servico sem agendamentos futuros', async () => {
		;(prisma.service.findUnique as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			name: 'Corte',
			UserId: 'usr_1',
		})
		;(prisma.appointment.count as jest.Mock).mockResolvedValue(0)
		;(prisma.service.update as jest.Mock).mockResolvedValue({ id: 'srv_1', deletedAt: new Date() })
		const result = await deleteService('srv_1')
		expect(result.success).toBe(true)
		expect(prisma.appointment.count).toHaveBeenCalled()
		// Verifica que usou update (soft-delete) em vez de delete
		expect(prisma.service.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'srv_1' },
				data: expect.objectContaining({ deletedAt: expect.any(Date), status: false }),
			}),
		)
	})
	test('deleteService bloqueia exclusao com agendamentos futuros', async () => {
		;(prisma.service.findUnique as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			name: 'Corte',
			UserId: 'usr_1',
		})
		;(prisma.appointment.count as jest.Mock).mockResolvedValue(3)
		const result = await deleteService('srv_1')
		expect(result.success).toBe(false)
		expect(result.error).toContain('3 agendamento(s) futuro(s)')
	})
	test('updateService retorna erro quando servico nao pertence', async () => {
		; (prisma.service.findUnique as jest.Mock).mockResolvedValue({
			id: 'srv_1',
			UserId: 'usr_2',
		})
		const result = await updateService({
			id: 'srv_1',
			name: 'Corte',
			price: 3000,
			duration: 30,
		})
		expect(result.success).toBe(false)
	})
	test('createService retorna erro quando prisma falha', async () => {
		; (prisma.service.create as jest.Mock).mockRejectedValue(
			new Error('db down'),
		)
		const result = await createService({
			name: 'Corte',
			price: 3000,
			duration: 30,
		})
		expect(result.success).toBe(false)
	})
})
