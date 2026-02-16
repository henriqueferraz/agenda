/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/auth.ts.
 * Valida getUserFromToken e getUserFromRequest com cookies e JWT.
 *
 * @example
 * npx jest tests/lib/auth.spec.ts
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromToken, getUserFromRequest } from '@/lib/auth'

const mockVerifyAccessToken = jest.fn()
jest.mock('@/lib/jwt', () => ({
	verifyAccessToken: (token: string) => mockVerifyAccessToken(token),
}))

const mockCookies = jest.fn()
jest.mock('next/headers', () => ({
	cookies: () => mockCookies(),
}))

describe('auth', () => {
	const mockUser = {
		id: 'user_123',
		name: 'Test User',
		email: 'user@example.com',
		image: null,
		be_called: null,
		token_called: null,
	}

	beforeEach(() => {
		jest.clearAllMocks()
		mockVerifyAccessToken.mockReset()
		;(prisma.user.findUnique as jest.Mock).mockReset()
	})

	describe('getUserFromToken', () => {
		test('returns user when valid token found in cookies', async () => {
			mockCookies.mockResolvedValue({
				get: (name: string) =>
					name === 'auth_token' ? { value: 'valid-jwt' } : undefined,
			})
			mockVerifyAccessToken.mockReturnValue({ sub: 'user_123' })
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

			const user = await getUserFromToken()

			expect(user).toEqual(mockUser)
			expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-jwt')
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user_123' },
				select: expect.any(Object),
			})
		})

		test('returns null when no cookie', async () => {
			mockCookies.mockResolvedValue({
				get: () => undefined,
			})

			const user = await getUserFromToken()

			expect(user).toBeNull()
			expect(mockVerifyAccessToken).not.toHaveBeenCalled()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})

		test('returns null when verifyAccessToken throws', async () => {
			mockCookies.mockResolvedValue({
				get: (name: string) =>
					name === 'auth_token' ? { value: 'bad-jwt' } : undefined,
			})
			mockVerifyAccessToken.mockImplementation(() => {
				throw new Error('invalid token')
			})

			const user = await getUserFromToken()

			expect(user).toBeNull()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})
	})

	describe('getUserFromRequest', () => {
		test('returns user when valid token in request cookies', async () => {
			const request = {
				cookies: {
					get: (name: string) =>
						name === 'auth_token' ? { value: 'valid-jwt' } : undefined,
				},
			} as unknown as NextRequest
			mockVerifyAccessToken.mockReturnValue({ sub: 'user_123' })
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

			const user = await getUserFromRequest(request)

			expect(user).toEqual(mockUser)
			expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-jwt')
		})

		test('returns null when no token', async () => {
			const request = {
				cookies: { get: () => undefined },
			} as unknown as NextRequest

			const user = await getUserFromRequest(request)

			expect(user).toBeNull()
			expect(mockVerifyAccessToken).not.toHaveBeenCalled()
		})
	})
})
