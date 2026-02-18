/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Testes do data-access getMessageConfig (F-03).
 * Valida busca de configuração, retorno de defaults e autenticação.
 *
 * @example
 * npx jest tests/app/data-access/message-config.spec.ts
 */
import prisma from '@/lib/prisma'
import { getMessageConfig } from '@/app/(panel)/dashboard/services/message/_data-access/get-message-config'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

describe('Data Access - getMessageConfig (F-03)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('retorna configuração existente do banco', async () => {
		;(prisma.messageConfig.findUnique as jest.Mock).mockResolvedValue({
			id: 'cfg_1',
			userId: 'usr_1',
			reminder7d: false,
			reminder24h: true,
			reminder2h: true,
			reminderChannel: 'both',
		})

		const result = await getMessageConfig({ userId: 'usr_1' })

		expect(result.id).toBe('cfg_1')
		expect(result.reminder7d).toBe(false)
		expect(result.reminder24h).toBe(true)
		expect(result.reminder2h).toBe(true)
		expect(result.reminderChannel).toBe('both')
		expect(prisma.messageConfig.findUnique).toHaveBeenCalledWith({
			where: { userId: 'usr_1' },
		})
	})

	test('retorna defaults quando não existe configuração', async () => {
		;(prisma.messageConfig.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await getMessageConfig({ userId: 'usr_1' })

		expect(result.id).toBe('')
		expect(result.reminder7d).toBe(true)
		expect(result.reminder24h).toBe(true)
		expect(result.reminder2h).toBe(true)
		expect(result.reminderChannel).toBe('whatsapp')
	})

	test('retorna defaults sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await getMessageConfig({ userId: 'usr_1' })

		expect(result.id).toBe('')
		expect(result.reminder7d).toBe(true)
		expect(prisma.messageConfig.findUnique).not.toHaveBeenCalled()
	})

	test('retorna defaults quando userId não corresponde à sessão', async () => {
		const result = await getMessageConfig({ userId: 'usr_other' })

		expect(result.id).toBe('')
		expect(prisma.messageConfig.findUnique).not.toHaveBeenCalled()
	})

	test('retorna defaults em caso de erro do Prisma', async () => {
		;(prisma.messageConfig.findUnique as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		const result = await getMessageConfig({ userId: 'usr_1' })

		expect(result.id).toBe('')
		expect(result.reminder7d).toBe(true)
	})
})
