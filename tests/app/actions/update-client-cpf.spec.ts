/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes unitarios para a server action updateClientCpf.
 * Valida protecao por role master, validacao de CPF,
 * unicidade por userId (@@unique([userId, cpf])) e cenarios de erro.
 *
 * @example
 * npx jest tests/app/actions/update-client-cpf.spec.ts
 */
import prisma from '@/lib/prisma'
import { updateClientCpf } from '@/app/(panel)/dashboard/admin/clients/_actions/update-client-cpf'

const mockGetUserFromToken = jest.fn()
jest.mock('@/lib/auth', () => ({
	getUserFromToken: () => mockGetUserFromToken(),
}))

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

describe('updateClientCpf', () => {
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

	const clientTarget = {
		id: 'cli_1',
		name: 'Cliente Teste',
		cpf: '12345678909',
		userId: 'usr_1',
	}

	test('retorna erro quando nao autenticado', async () => {
		mockGetUserFromToken.mockResolvedValue(null)

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Não autenticado.')
	})

	test('retorna erro quando usuario nao e master', async () => {
		mockGetUserFromToken.mockResolvedValue({ ...masterSession, role: 'enterprise' })

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Acesso negado. Somente administradores.')
	})

	test('retorna erro quando clientId vazio', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)

		const result = await updateClientCpf({ clientId: '', cpf: '12345678909' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('ID do cliente é obrigatório')
	})

	test('retorna erro quando CPF muito curto', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '123' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('CPF é obrigatório')
	})

	test('retorna erro quando CPF invalido', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '11111111111' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('CPF inválido.')
	})

	test('retorna erro quando cliente nao existe', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.client.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await updateClientCpf({ clientId: 'inexistente', cpf: '27182322005' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Cliente não encontrado.')
	})

	test('retorna erro quando CPF ja em uso por outro cliente do mesmo usuario', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.client.findUnique as jest.Mock).mockResolvedValue(clientTarget)
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue({
			id: 'cli_outro',
			cpf: '27182322005',
			userId: 'usr_1',
		})

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '27182322005' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Este CPF já está em uso por outro cliente deste usuário.')
	})

	test('atualiza CPF com sucesso quando valido e unico', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.client.findUnique as jest.Mock).mockResolvedValue(clientTarget)
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.client.update as jest.Mock).mockResolvedValue({})

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '271.823.220-05' })
		expect(result.success).toBe(true)
		expect(result.message).toContain('Cliente Teste')

		const updateCall = (prisma.client.update as jest.Mock).mock.calls[0][0]
		expect(updateCall.data.cpf).toBe('27182322005')
	})

	test('nao verifica unicidade quando CPF nao mudou', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.client.findUnique as jest.Mock).mockResolvedValue(clientTarget)
		;(prisma.client.update as jest.Mock).mockResolvedValue({})

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '12345678909' })
		expect(result.success).toBe(true)
		expect(prisma.client.findFirst).not.toHaveBeenCalled()
	})

	test('aceita CPF com mascara', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.client.findUnique as jest.Mock).mockResolvedValue(clientTarget)
		;(prisma.client.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.client.update as jest.Mock).mockResolvedValue({})

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '542.263.220-61' })
		expect(result.success).toBe(true)

		const updateCall = (prisma.client.update as jest.Mock).mock.calls[0][0]
		expect(updateCall.data.cpf).toBe('54226322061')
	})

	test('retorna erro quando prisma falha', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.client.findUnique as jest.Mock).mockRejectedValue(new Error('db down'))

		const result = await updateClientCpf({ clientId: 'cli_1', cpf: '27182322005' })
		expect(result.success).toBe(false)
		expect(result.error).toBe('Erro interno ao atualizar CPF.')
	})
})
