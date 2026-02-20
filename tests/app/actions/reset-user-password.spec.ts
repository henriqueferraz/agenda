/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes unitarios para a server action resetUserPassword.
 * Valida protecao por role master, geracao de token, envio de email,
 * registro de security log e cenarios de erro.
 *
 * @example
 * npx jest tests/app/actions/reset-user-password.spec.ts
 */
import prisma from '@/lib/prisma'
import { resetUserPassword } from '@/app/(panel)/dashboard/admin/users/_actions/reset-user-password'

const mockGetUserFromToken = jest.fn()
jest.mock('@/lib/auth', () => ({
	getUserFromToken: () => mockGetUserFromToken(),
}))

const mockSendEmail = jest.fn()
jest.mock('@/lib/email', () => ({
	sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

const mockLogSecurityEvent = jest.fn()
jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: (...args: unknown[]) => mockLogSecurityEvent(...args),
}))

jest.mock('@/lib/tokens', () => ({
	generateRandomToken: () => 'mock_token_hex',
	hashToken: () => 'mock_token_hash',
}))

describe('resetUserPassword', () => {
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
	}

	test('retorna erro quando nao autenticado', async () => {
		mockGetUserFromToken.mockResolvedValue(null)

		const result = await resetUserPassword('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Não autenticado.')
	})

	test('retorna erro quando usuario nao e master', async () => {
		mockGetUserFromToken.mockResolvedValue({ ...masterSession, role: 'enterprise' })

		const result = await resetUserPassword('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Acesso negado. Somente administradores.')
	})

	test('retorna erro quando userId vazio', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)

		const result = await resetUserPassword('')
		expect(result.success).toBe(false)
		expect(result.error).toBe('ID do usuário é obrigatório')
	})

	test('retorna erro quando usuario alvo nao existe', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

		const result = await resetUserPassword('inexistente')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Usuário não encontrado.')
	})

	test('retorna erro quando usuario alvo nao e enterprise', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...enterpriseTarget,
			role: 'master',
		})

		const result = await resetUserPassword('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Somente usuários enterprise podem ter senha resetada.')
	})

	test('gera token, envia email e registra log com sucesso', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)
		;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({})
		mockSendEmail.mockResolvedValue(undefined)
		mockLogSecurityEvent.mockResolvedValue(undefined)

		const result = await resetUserPassword('ent_1')
		expect(result.success).toBe(true)
		expect(result.message).toContain('empresa@teste.com')

		expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				email: 'empresa@teste.com',
				tokenHash: 'mock_token_hash',
				userId: 'ent_1',
			}),
		})

		expect(mockSendEmail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'empresa@teste.com',
				subject: 'Redefinição de senha solicitada pelo administrador',
			}),
		)

		expect(mockLogSecurityEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'master_1',
				email: 'empresa@teste.com',
				action: 'ADMIN_PASSWORD_RESET',
				metadata: expect.objectContaining({
					targetUserId: 'ent_1',
					performedBy: 'admin@teste.com',
				}),
			}),
		)
	})

	test('email contém link de reset com token', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)
		;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({})
		mockSendEmail.mockResolvedValue(undefined)
		mockLogSecurityEvent.mockResolvedValue(undefined)

		await resetUserPassword('ent_1')

		const emailCall = mockSendEmail.mock.calls[0][0]
		expect(emailCall.html).toContain('mock_token_hex')
		expect(emailCall.html).toContain('reset-password?token=')
	})

	test('retorna erro quando envio de email falha', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(enterpriseTarget)
		;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({})
		mockSendEmail.mockRejectedValue(new Error('SMTP fail'))

		const result = await resetUserPassword('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Erro interno ao resetar senha.')
	})

	test('retorna erro quando prisma falha', async () => {
		mockGetUserFromToken.mockResolvedValue(masterSession)
		;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'))

		const result = await resetUserPassword('ent_1')
		expect(result.success).toBe(false)
		expect(result.error).toBe('Erro interno ao resetar senha.')
	})
})
