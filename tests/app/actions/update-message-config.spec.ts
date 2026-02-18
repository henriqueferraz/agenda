/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action updateMessageConfig (F-03).
 * Valida upsert, autenticação, validação Zod e tratamento de erros.
 *
 * @example
 * npx jest tests/app/actions/update-message-config.spec.ts
 */
import prisma from '@/lib/prisma'
import { updateMessageConfig } from '@/app/(panel)/dashboard/services/message/_actions/update-message-config'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('Server Actions - updateMessageConfig (F-03)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const validData = {
		reminder7d: true,
		reminder24h: true,
		reminder2h: false,
		reminderChannel: 'whatsapp' as const,
	}

	test('cria/atualiza configuração com sucesso (upsert)', async () => {
		;(prisma.messageConfig.upsert as jest.Mock).mockResolvedValue({
			id: 'cfg_1',
			userId: 'usr_1',
			...validData,
		})

		const result = await updateMessageConfig(validData)

		expect(result.success).toBe(true)
		expect(result.message).toBe('Configurações salvas com sucesso!')
		expect(prisma.messageConfig.upsert).toHaveBeenCalledWith({
			where: { userId: 'usr_1' },
			update: validData,
			create: { userId: 'usr_1', ...validData },
		})
	})

	test('retorna erro sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await updateMessageConfig(validData)

		expect(result.success).toBe(false)
		expect(result.error).toContain('Não autenticado')
		expect(prisma.messageConfig.upsert).not.toHaveBeenCalled()
	})

	test('revalida o caminho correto', async () => {
		;(prisma.messageConfig.upsert as jest.Mock).mockResolvedValue({
			id: 'cfg_1',
		})
		const { revalidatePath } = await import('next/cache')

		await updateMessageConfig(validData)

		expect(revalidatePath).toHaveBeenCalledWith('/dashboard/services/message')
	})

	test('aceita canal "both"', async () => {
		;(prisma.messageConfig.upsert as jest.Mock).mockResolvedValue({
			id: 'cfg_1',
		})

		const result = await updateMessageConfig({
			...validData,
			reminderChannel: 'both',
		})

		expect(result.success).toBe(true)
	})

	test('aceita canal "email"', async () => {
		;(prisma.messageConfig.upsert as jest.Mock).mockResolvedValue({
			id: 'cfg_1',
		})

		const result = await updateMessageConfig({
			...validData,
			reminderChannel: 'email',
		})

		expect(result.success).toBe(true)
	})

	test('rejeita canal inválido', async () => {
		const result = await updateMessageConfig({
			...validData,
			reminderChannel: 'telegram' as 'whatsapp',
		})

		expect(result.success).toBe(false)
		expect(prisma.messageConfig.upsert).not.toHaveBeenCalled()
	})

	test('retorna erro em caso de falha do Prisma', async () => {
		;(prisma.messageConfig.upsert as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		const result = await updateMessageConfig(validData)

		expect(result.success).toBe(false)
		expect(result.error).toContain('Erro ao salvar')
	})
})
