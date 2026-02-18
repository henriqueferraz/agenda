/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes de lib/auth-refresh.ts — performTokenRefresh.
 * Verifica fluxo completo: verificação JWT, busca no banco, revogação,
 * emissão de novos tokens e persistência.
 *
 * @example
 * npx jest tests/lib/auth-refresh.spec.ts --no-cache
 */
import prisma from '@/lib/prisma'
import { performTokenRefresh } from '@/lib/auth-refresh'

jest.mock('@/lib/jwt', () => ({
	verifyRefreshToken: jest.fn(() => ({
		sub: 'usr_1',
		email: 'henrique@teste.com',
		name: 'Henrique',
	})),
	signAccessToken: jest.fn(() => 'new-access-token'),
	signRefreshToken: jest.fn(() => 'new-refresh-token'),
	REFRESH_EXPIRES_MS: 86400000,
}))
jest.mock('@/lib/tokens', () => ({
	hashToken: jest.fn(() => 'hashed-token'),
}))

describe('performTokenRefresh', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('retorna novo par de tokens quando refresh é válido', async () => {
		;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({ id: 'rt_1' })
		;(prisma.refreshToken.update as jest.Mock).mockResolvedValue({ id: 'rt_1' })
		;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt_2' })

		const result = await performTokenRefresh('valid-refresh-cookie')

		expect(result).not.toBeNull()
		expect(result?.accessToken).toBe('new-access-token')
		expect(result?.refreshToken).toBe('new-refresh-token')
		expect(prisma.refreshToken.update).toHaveBeenCalledWith({
			where: { id: 'rt_1' },
			data: { revokedAt: expect.any(Date) },
		})
		expect(prisma.refreshToken.create).toHaveBeenCalled()
	})

	test('retorna null quando token não encontrado no banco', async () => {
		;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null)

		const result = await performTokenRefresh('invalid-refresh-cookie')

		expect(result).toBeNull()
		expect(prisma.refreshToken.update).not.toHaveBeenCalled()
	})

	test('retorna null quando verifyRefreshToken lança exceção', async () => {
		const { verifyRefreshToken } = await import('@/lib/jwt')
		;(verifyRefreshToken as jest.Mock).mockImplementationOnce(() => {
			throw new Error('token expirado')
		})

		const result = await performTokenRefresh('expired-refresh-cookie')

		expect(result).toBeNull()
	})

	test('retorna null quando Prisma lança exceção', async () => {
		;(prisma.refreshToken.findFirst as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		const result = await performTokenRefresh('valid-refresh-cookie')

		expect(result).toBeNull()
	})

	test('revoga token antigo antes de criar novo', async () => {
		const callOrder: string[] = []
		;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({ id: 'rt_1' })
		;(prisma.refreshToken.update as jest.Mock).mockImplementation(async () => {
			callOrder.push('update')
			return { id: 'rt_1' }
		})
		;(prisma.refreshToken.create as jest.Mock).mockImplementation(async () => {
			callOrder.push('create')
			return { id: 'rt_2' }
		})

		await performTokenRefresh('valid-refresh-cookie')

		expect(callOrder).toEqual(['update', 'create'])
	})
})
