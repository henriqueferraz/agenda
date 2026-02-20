/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes unitarios para a server action updateUserDocuments.
 * Valida protecao por role master, validacao de CPF e CNPJ,
 * unicidade de CPF e cenarios de erro.
 *
 * @example
 * npx jest tests/app/actions/update-user-documents.spec.ts
 */
import prisma from '@/lib/prisma'
import { updateUserDocuments } from '@/app/(panel)/dashboard/admin/users/_actions/update-user-documents'

const mockGetUserFromToken = jest.fn()
jest.mock('@/lib/auth', () => ({
	getUserFromToken: () => mockGetUserFromToken(),
}))

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('updateUserDocuments', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const masterSession = {
		id: 'master_1',
		name: 'Admin',
		email: 'admin@teste.com',
		role: 'master',
		trialEndsAt: null,
		image: null,
		be_called: null,
		token_called: null,
	}

	const enterpriseTarget = {
		id: 'ent_1',
		name: 'Empresa',
		email: 'empresa@teste.com',
		role: 'enterprise',
		cpf: '12345678909',
		cnpj: null,
	}

	test('retorna erro quando nao autenticado', async () => {
		mockGetUserFromToken.mockResolvedValue(null)

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Não autenticado.')
	})

	test('retorna erro quando usuario nao e master', async () => {
		mockGetUserFromToken.mockResolvedValue({ ...masterSession, role: 'enterprise' })

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Acesso negado. Somente administradores.')
	})

	test('retorna erro quando userId vazio', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)

		const result = await updateUserDocuments({ userId: '', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('ID do usuário é obrigatório')
	})

	test('retorna erro quando usuario alvo nao existe', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await updateUserDocuments({ userId: 'inexistente', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Usuário não encontrado.')
	})

	test('retorna erro quando usuario alvo nao e enterprise', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...enterpriseTarget,
			role: 'master',
		})

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Somente usuários enterprise podem ser editados.')
	})

	test('retorna erro quando CPF invalido', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '11111111111' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('CPF inválido.')
	})

	test('retorna erro quando CPF ja em uso por outro usuario', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock)
			.mockResolvedValueOnce(enterpriseTarget)
			.mockResolvedValueOnce({ id: 'ent_outro', cpf: '27182322005' })

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '27182322005' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Este CPF já está em uso por outro usuário.')
	})

	test('atualiza CPF com sucesso quando valido e unico', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock)
			.mockResolvedValueOnce(enterpriseTarget)
			.mockResolvedValueOnce(null)
		;(prisma.user.update as jest.Mock).mockResolvedValue({})

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '271.823.220-05' })
		expect(result.success).toBe(true)
		expect(result.message).toContain('Empresa')

		const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
		expect(updateCall.data.cpf).toBe('27182322005')
	})

	test('retorna erro quando CNPJ invalido', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)

		const result = await updateUserDocuments({ userId: 'ent_1', cnpj: '11111111111111' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('CNPJ inválido.')
	})

	test('atualiza CNPJ com sucesso', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)
		;(prisma.user.update as jest.Mock).mockResolvedValue({})

		const result = await updateUserDocuments({ userId: 'ent_1', cnpj: '11.222.333/0001-81' })
		expect(result.success).toBe(true)

		const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
		expect(updateCall.data.cnpj).toBe('11222333000181')
	})

	test('retorna erro quando nenhum dado fornecido', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)

		const result = await updateUserDocuments({ userId: 'ent_1' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Nenhum dado para atualizar.')
	})

	test('nao verifica unicidade quando CPF nao mudou', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(enterpriseTarget)
		;(prisma.user.update as jest.Mock).mockResolvedValue({})

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '12345678909' })
		expect(result.success).toBe(true)
		expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
	})

	test('retorna erro quando prisma falha', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'))

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Erro interno ao atualizar documentos.')
	})

	test('limpa CPF quando string vazia', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)
		;(prisma.user.update as jest.Mock).mockResolvedValue({})

		const result = await updateUserDocuments({ userId: 'ent_1', cpf: '', cnpj: '11.222.333/0001-81' })
		expect(result.success).toBe(true)

		const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
		expect(updateCall.data.cpf).toBeNull()
		expect(updateCall.data.cnpj).toBe('11222333000181')
	})
})
