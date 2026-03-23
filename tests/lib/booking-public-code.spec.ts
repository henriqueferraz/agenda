/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-23
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Testes para `lib/booking-public-code.ts`: geracao de codigo curto e persistencia lazy.
 *
 * @example
 * npx jest tests/lib/booking-public-code.spec.ts
 */
import prisma from '@/lib/prisma'
import {
	generateBookingPublicCode,
	ensureBookingPublicCodeForUser,
} from '@/lib/booking-public-code'

describe('booking-public-code', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('generateBookingPublicCode', () => {
		test('returns 20 chars [a-z0-9]', () => {
			const code = generateBookingPublicCode()
			expect(code).toHaveLength(20)
			expect(code).toMatch(/^[a-z0-9]{20}$/)
		})
	})

	describe('ensureBookingPublicCodeForUser', () => {
		test('returns null when userId is empty', async () => {
			expect(await ensureBookingPublicCodeForUser('')).toBeNull()
			expect(prisma.user.findUnique).not.toHaveBeenCalled()
		})

		test('returns null when user not found', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
			expect(await ensureBookingPublicCodeForUser('u1')).toBeNull()
		})

		test('returns null when token_called is missing', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				token_called: null,
				booking_public_code: null,
			})
			expect(await ensureBookingPublicCodeForUser('u1')).toBeNull()
		})

		test('returns existing booking_public_code without update', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				token_called: 'empresa-deadbeef',
				booking_public_code: 'a1b2c3d4e5f6g7h8i9j0',
			})
			expect(await ensureBookingPublicCodeForUser('u1')).toBe(
				'a1b2c3d4e5f6g7h8i9j0',
			)
			expect(prisma.user.update).not.toHaveBeenCalled()
		})

		test('persists new code when missing', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				token_called: 'empresa-deadbeef',
				booking_public_code: null,
			})
			;(prisma.user.update as jest.Mock).mockResolvedValue({})
			const code = await ensureBookingPublicCodeForUser('u1')
			expect(code).toMatch(/^[a-z0-9]{20}$/)
			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: 'u1' },
				data: { booking_public_code: code },
			})
		})

		test('retries on P2002 unique violation', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				token_called: 'empresa-deadbeef',
				booking_public_code: null,
			})
			const p2002 = { code: 'P2002' }
			;(prisma.user.update as jest.Mock)
				.mockRejectedValueOnce(p2002)
				.mockResolvedValueOnce({})
			const code = await ensureBookingPublicCodeForUser('u1')
			expect(code).toMatch(/^[a-z0-9]{20}$/)
			expect(prisma.user.update).toHaveBeenCalledTimes(2)
		})
	})
})
