/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Lógica compartilhada de refresh de tokens JWT.
 * Valida o refresh token (JWT + banco), revoga o antigo e emite novo par
 * (access + refresh). Usada pela rota POST /api/auth/refresh e pela
 * bounce route GET /api/auth/refresh-bounce.
 *
 * @example
 * import { performTokenRefresh } from '@/lib/auth-refresh'
 *
 * const result = await performTokenRefresh(refreshCookie)
 * if (!result) redirect('/login')
 * setAuthCookies(response, result.accessToken, result.refreshToken)
 */
import prisma from '@/lib/prisma'
import {
	verifyRefreshToken,
	signAccessToken,
	signRefreshToken,
	REFRESH_EXPIRES_MS,
} from '@/lib/jwt'
import { hashToken } from '@/lib/tokens'

/** Resultado bem-sucedido do refresh de tokens. */
interface RefreshResult {
	/** Novo access token JWT assinado. */
	accessToken: string
	/** Novo refresh token JWT assinado. */
	refreshToken: string
}

/**
 * Executa o fluxo completo de refresh de tokens.
 * Verifica assinatura JWT do refresh token, busca no banco (não revogado, não expirado),
 * revoga o antigo e emite novo par de tokens.
 *
 * @param refreshCookie - Valor do cookie refresh_token
 * @returns Novo par de tokens ou null se inválido/expirado
 *
 * @example
 * ```typescript
 * const result = await performTokenRefresh(refreshCookie)
 * if (result) {
 *   setAuthCookies(response, result.accessToken, result.refreshToken)
 * }
 * ```
 */
export const performTokenRefresh = async (
	refreshCookie: string,
): Promise<RefreshResult | null> => {
	try {
		const payload = verifyRefreshToken(refreshCookie)
		const tokenHash = hashToken(refreshCookie)

		const stored = await prisma.refreshToken.findFirst({
			where: {
				tokenHash,
				revokedAt: null,
				expiresAt: { gt: new Date() },
			},
		})

		if (!stored) {
			return null
		}

		await prisma.refreshToken.update({
			where: { id: stored.id },
			data: { revokedAt: new Date() },
		})

		const newPayload = {
			sub: payload.sub,
			email: payload.email,
			name: payload.name,
		}

		const accessToken = signAccessToken(newPayload)
		const refreshToken = signRefreshToken(newPayload)

		await prisma.refreshToken.create({
			data: {
				userId: payload.sub,
				tokenHash: hashToken(refreshToken),
				expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
			},
		})

		return { accessToken, refreshToken }
	} catch {
		return null
	}
}
