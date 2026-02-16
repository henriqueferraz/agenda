/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitarios para as server actions de lembretes (Reminders).
 * Valida criacao, atualizacao e exclusao usando mocks de Prisma e auth.
 *
 * @example
 * npx jest tests/app/actions/reminders.spec.ts
 */
import prisma from '@/lib/prisma'
import { createReminder } from '@/app/(panel)/dashboard/dashboard/_actions/create-reminder'
import { updateReminder } from '@/app/(panel)/dashboard/dashboard/_actions/update-reminder'
import { deleteReminder } from '@/app/(panel)/dashboard/dashboard/_actions/delete-reminder'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('Server Actions - Reminders', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('createReminder cria lembrete', async () => {
		;(prisma.reminder.create as jest.Mock).mockResolvedValue({ id: 'rem_1' })
		const result = await createReminder({
			description: 'Ligar para cliente',
		})
		expect(result.success).toBe(true)
	})

	test('updateReminder atualiza lembrete', async () => {
		;(prisma.reminder.findFirst as jest.Mock).mockResolvedValue({
			id: 'rem_1',
			UserId: 'usr_1',
		})
		;(prisma.reminder.update as jest.Mock).mockResolvedValue({ id: 'rem_1' })
		const result = await updateReminder({
			id: 'rem_1',
			description: 'Atualizado',
		})
		expect(result.success).toBe(true)
	})

	test('deleteReminder remove lembrete', async () => {
		;(prisma.reminder.findFirst as jest.Mock).mockResolvedValue({
			id: 'rem_1',
			UserId: 'usr_1',
		})
		;(prisma.reminder.delete as jest.Mock).mockResolvedValue({ id: 'rem_1' })
		const result = await deleteReminder({
			id: 'rem_1',
		})
		expect(result.success).toBe(true)
	})
})
