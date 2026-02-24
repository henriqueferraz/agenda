/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Testes do data-access getBookingLinkShareStats.
 * Valida agregação de métricas por origem, autenticação e fallback em erro.
 *
 * @example
 * npx jest tests/app/data-access/get-booking-link-share-stats.spec.ts
 */
import prisma from '@/lib/prisma'
import { getBookingLinkShareStats } from '@/app/(panel)/dashboard/dashboard/_data-access/get-booking-link-share-stats'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

describe('Data Access - getBookingLinkShareStats', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('agrega os compartilhamentos por canal', async () => {
		;(prisma.securityLog.findMany as jest.Mock).mockResolvedValue([
			{ metadata: { source: 'whatsapp' } },
			{ metadata: { source: 'whatsapp' } },
			{ metadata: { source: 'instagram' } },
			{ metadata: { source: 'copy' } },
			{ metadata: { source: 'invalid' } },
		])

		const stats = await getBookingLinkShareStats({ userId: 'usr_1' })

		expect(stats.total).toBe(4)
		expect(stats.whatsapp).toBe(2)
		expect(stats.instagram).toBe(1)
		expect(stats.copy).toBe(1)
		expect(stats.facebook).toBe(0)
		expect(stats.tiktok).toBe(0)
	})

	test('retorna zeros sem autenticação', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const stats = await getBookingLinkShareStats({ userId: 'usr_1' })

		expect(stats.total).toBe(0)
		expect(prisma.securityLog.findMany).not.toHaveBeenCalled()
	})

	test('retorna zeros quando userId não corresponde à sessão', async () => {
		const stats = await getBookingLinkShareStats({ userId: 'usr_other' })

		expect(stats.total).toBe(0)
		expect(prisma.securityLog.findMany).not.toHaveBeenCalled()
	})

	test('retorna zeros quando prisma falha', async () => {
		;(prisma.securityLog.findMany as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		const stats = await getBookingLinkShareStats({ userId: 'usr_1' })

		expect(stats.total).toBe(0)
		expect(stats.whatsapp).toBe(0)
		expect(stats.instagram).toBe(0)
		expect(stats.facebook).toBe(0)
		expect(stats.tiktok).toBe(0)
		expect(stats.copy).toBe(0)
	})
})
