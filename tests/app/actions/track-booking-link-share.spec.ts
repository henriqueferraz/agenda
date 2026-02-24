/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Testes da server action trackBookingLinkShare.
 * Valida autenticação, origem permitida e registro de evento no SecurityLog.
 *
 * @example
 * npx jest tests/app/actions/track-booking-link-share.spec.ts
 */
import { trackBookingLinkShare } from '@/app/(panel)/dashboard/dashboard/_actions/track-booking-link-share'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))

jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))

describe('Server Action - trackBookingLinkShare', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('registra evento de compartilhamento com sucesso', async () => {
		const { logSecurityEvent } = await import('@/lib/security-log')
		const result = await trackBookingLinkShare({ source: 'whatsapp' })

		expect(result.success).toBe(true)
		expect(logSecurityEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'usr_1',
				action: 'BOOKING_LINK_SHARE',
				metadata: {
					source: 'whatsapp',
					channel: 'public_booking_link',
				},
			}),
		)
	})

	test('retorna erro quando usuário não está autenticado', async () => {
		const { getUserFromToken } = await import('@/lib/auth')
		const { logSecurityEvent } = await import('@/lib/security-log')
		;(getUserFromToken as jest.Mock).mockResolvedValueOnce(null)

		const result = await trackBookingLinkShare({ source: 'copy' })

		expect(result.success).toBe(false)
		expect(result.message).toContain('não autenticado')
		expect(logSecurityEvent).not.toHaveBeenCalled()
	})

	test('retorna erro para origem inválida', async () => {
		const { logSecurityEvent } = await import('@/lib/security-log')
		const result = await trackBookingLinkShare({
			source: 'telegram' as 'whatsapp',
		})

		expect(result.success).toBe(false)
		expect(logSecurityEvent).not.toHaveBeenCalled()
	})
})
