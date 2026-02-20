/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Testes unitarios para a server action extendTrial.
 * Valida que somente usuarios master podem estender trial de enterprise,
 * que a extensao funciona corretamente e que erros sao tratados.
 *
 * @example
 * npx jest tests/app/actions/extend-trial.spec.ts
 */
import prisma from '@/lib/prisma'
import { extendTrial } from '@/app/(panel)/dashboard/admin/users/_actions/extend-trial'

const mockGetUserFromToken = jest.fn()
jest.mock('@/lib/auth', () => ({
	getUserFromToken: () => mockGetUserFromToken(),
}))

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('extendTrial', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const masterUser = {
		id: 'master_1',
		name: 'Admin',
		email: 'admin@teste.com',
		role: 'master',
		trialEndsAt: null,
		image: null,
		be_called: null,
		token_called: null,
	}

	const enterpriseUser = {
		id: 'ent_1',
		name: 'Empresa',
		email: 'empresa@teste.com',
		role: 'enterprise',
		trialEndsAt: new Date(Date.now() - 86400000),
		image: null,
		be_called: null,
		token_called: null,
	}

	test('retorna erro quando nao autenticado', async () => {
		mockGetUserFromToken.mockResolvedValue(null)

		const result = await extendTrial('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Não autenticado.')
	})

	test('retorna erro quando usuario nao e master', async () => {
		mockGetUserFromToken.mockResolvedValue({
			...enterpriseUser,
			id: 'ent_2',
		})

		const result = await extendTrial('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Acesso negado. Somente administradores.')
	})

	test('retorna erro quando usuario alvo nao existe', async () => {
		mockGetUserFromToken.mockResolvedValue(masterUser)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await extendTrial('inexistente')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Usuário não encontrado.')
	})

	test('retorna erro quando usuario alvo nao e enterprise', async () => {
		mockGetUserFromToken.mockResolvedValue(masterUser)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'master_2',
			role: 'master',
			trialEndsAt: null,
			name: 'Outro Admin',
		})

		const result = await extendTrial('master_2')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Somente usuários enterprise podem ter trial estendido.')
	})

	test('estende trial em 30 dias a partir de agora quando expirado', async () => {
		mockGetUserFromToken.mockResolvedValue(masterUser)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'ent_1',
			role: 'enterprise',
			trialEndsAt: new Date(Date.now() - 86400000),
			name: 'Empresa',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({})

		const result = await extendTrial('ent_1')
		expect(result.success).toBe(true)
		expect(result.message).toContain('Empresa')

		const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
		const newTrialEndsAt = updateCall.data.trialEndsAt as Date
		const daysFromNow = (newTrialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
		expect(daysFromNow).toBeGreaterThan(29)
		expect(daysFromNow).toBeLessThan(31)
	})

	test('estende trial em 30 dias a partir do fim atual quando ainda ativo', async () => {
		const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
		mockGetUserFromToken.mockResolvedValue(masterUser)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'ent_1',
			role: 'enterprise',
			trialEndsAt: futureDate,
			name: 'Empresa',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({})

		const result = await extendTrial('ent_1')
		expect(result.success).toBe(true)

		const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
		const newTrialEndsAt = updateCall.data.trialEndsAt as Date
		const daysFromFuture = (newTrialEndsAt.getTime() - futureDate.getTime()) / (1000 * 60 * 60 * 24)
		expect(daysFromFuture).toBeGreaterThan(29)
		expect(daysFromFuture).toBeLessThan(31)
	})

	test('retorna erro quando userId vazio', async () => {
		mockGetUserFromToken.mockResolvedValue(masterUser)

		const result = await extendTrial('')
		expect(result.success).toBe(false)
		expect(result.error).toBe('ID do usuário é obrigatório')
	})

	test('retorna erro quando prisma falha', async () => {
		mockGetUserFromToken.mockResolvedValue(masterUser)
		;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'))

		const result = await extendTrial('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Erro interno ao estender trial.')
	})
})
