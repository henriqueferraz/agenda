/**
 * Rota de refresh de tokens. Valida o refresh token do cookie, revoga o antigo,
 * emite novo access e refresh token e define os novos cookies na resposta.
 *
 * @example
 * const res = await fetch('/api/auth/refresh', {
 *   method: 'POST',
 *   credentials: 'include',
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
	verifyRefreshToken,
	signAccessToken,
	signRefreshToken,
} from '@/lib/jwt'
import { hashToken } from '@/lib/tokens'
import { setAuthCookies } from '@/lib/auth-cookies'

/**
 * Handler POST para renovar tokens. Lê refresh_token do cookie, verifica assinatura
 * e existência no banco, revoga o token antigo, cria novo par e define cookies.
 *
 * @param request - Requisição contendo cookie refresh_token.
 * @returns NextResponse com message e Set-Cookie em 200, ou error em 401/500.
 */
export const POST = async (request: NextRequest) => {
	try {
		const refreshCookie = request.cookies.get('refresh_token')?.value
		if (!refreshCookie) {
			return NextResponse.json(
				{ error: 'Refresh token ausente.' },
				{ status: 401 },
			)
		}
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
			return NextResponse.json(
				{ error: 'Refresh token inválido.' },
				{ status: 401 },
			)
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
		const newAccess = signAccessToken(newPayload)
		const newRefresh = signRefreshToken(newPayload)
		await prisma.refreshToken.create({
			data: {
				userId: payload.sub,
				tokenHash: hashToken(newRefresh),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		})
		const response = NextResponse.json({ message: 'Token atualizado.' })
		setAuthCookies(response, newAccess, newRefresh)
		return response
	} catch (error) {
		console.error('Erro ao atualizar token:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao atualizar token.' },
			{ status: 500 },
		)
	}
}
