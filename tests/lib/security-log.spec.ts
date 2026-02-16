/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/security-log.ts.
 * Valida registro de eventos de segurança via prisma.securityLog.create.
 *
 * @example
 * npx jest tests/lib/security-log.spec.ts
 */
import prisma from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/security-log'

describe('security-log', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		jest.spyOn(console, 'error').mockImplementation()
	})

	afterEach(() => {
		;(console.error as jest.Mock).mockRestore()
	})

	test('logSecurityEvent calls prisma.securityLog.create with correct data', async () => {
		;(prisma.securityLog.create as jest.Mock).mockResolvedValue({})

		await logSecurityEvent({
			userId: 'user_123',
			email: 'user@example.com',
			ip: '192.168.1.1',
			action: 'LOGIN_SUCCESS',
			metadata: { device: 'mobile' },
		})

		expect(prisma.securityLog.create).toHaveBeenCalledWith({
			data: {
				userId: 'user_123',
				email: 'user@example.com',
				ip: '192.168.1.1',
				action: 'LOGIN_SUCCESS',
				metadata: { device: 'mobile' },
			},
		})
	})

	test('logSecurityEvent does not throw when prisma fails (catches error internally)', async () => {
		;(prisma.securityLog.create as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		await expect(
			logSecurityEvent({
				action: 'LOGIN_FAILURE',
				email: 'fail@test.com',
			}),
		).resolves.toBeUndefined()

		expect(console.error).toHaveBeenCalled()
	})
})
