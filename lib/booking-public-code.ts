/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-23
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Gera e persiste o codigo publico curto de agendamento (`booking_public_code` no User).
 * O codigo tem 20 caracteres [a-z0-9], sem hifen, para URLs curtas `/a/{code}`.
 * A rota longa `/agendamento/{token_called}` continua valida.
 *
 * @example
 * import { ensureBookingPublicCodeForUser } from '@/lib/booking-public-code'
 *
 * const code = await ensureBookingPublicCodeForUser('cmk069h7v0000o1ui5n6uk0km')
 * if (code) {
 *   const url = `${process.env.NEXT_PUBLIC_APP_URL}/a/${code}`
 * }
 */
import { randomInt } from 'crypto'
import prisma from '@/lib/prisma'

const BOOKING_CODE_LENGTH = 20
const BOOKING_CODE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const MAX_PERSIST_ATTEMPTS = 8

/**
 * Gera um codigo aleatorio de 20 caracteres usando `crypto.randomInt` (sem Math.random).
 * @returns String com exatamente 20 caracteres [a-z0-9]
 * @example
 * const code = generateBookingPublicCode()
 * // 'k3m9p2x7q1w4r8t6y0z5'
 */
export const generateBookingPublicCode = (): string => {
	let out = ''
	for (let i = 0; i < BOOKING_CODE_LENGTH; i++) {
		out += BOOKING_CODE_ALPHABET[randomInt(BOOKING_CODE_ALPHABET.length)]
	}
	return out
}

/**
 * Garante que o usuario tenha `booking_public_code`. Se ja existir, retorna o valor atual.
 * Se nao existir e houver `token_called`, gera codigo unico com retentativas em P2002.
 *
 * @param userId - ID do usuario (empresa)
 * @returns Codigo curto ou null se usuario nao existir ou nao tiver token_called
 *
 * @example
 * const code = await ensureBookingPublicCodeForUser(session.id)
 */
export const ensureBookingPublicCodeForUser = async (
	userId: string,
): Promise<string | null> => {
	if (!userId) {
		return null
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { token_called: true, booking_public_code: true },
	})

	if (!user?.token_called) {
		return null
	}

	if (user.booking_public_code) {
		return user.booking_public_code
	}

	for (let attempt = 0; attempt < MAX_PERSIST_ATTEMPTS; attempt++) {
		const code = generateBookingPublicCode()
		try {
			await prisma.user.update({
				where: { id: userId },
				data: { booking_public_code: code },
			})
			return code
		} catch (error: unknown) {
			const isUniqueViolation =
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'P2002'
			if (!isUniqueViolation) {
				console.error('ensureBookingPublicCodeForUser: falha ao persistir codigo', {
					userId,
					attempt,
					message: error instanceof Error ? error.message : error,
				})
				return null
			}
		}
	}

	console.error('ensureBookingPublicCodeForUser: esgotadas retentativas P2002', {
		userId,
	})
	return null
}
