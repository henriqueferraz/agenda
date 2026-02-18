/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/auth/refresh — renova tokens via chamada direta (JSON response).
 * Valida o refresh token do cookie via performTokenRefresh, emite novo par
 * de tokens e define os novos cookies na resposta.
 *
 * @example
 * const res = await fetch('/api/auth/refresh', {
 *   method: 'POST',
 *   credentials: 'include',
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { performTokenRefresh } from '@/lib/auth-refresh'
import { setAuthCookies } from '@/lib/auth-cookies'

/**
 * Handler POST para renovar tokens. Lê refresh_token do cookie, delega
 * para performTokenRefresh (validação JWT + Prisma) e define novos cookies.
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

		const result = await performTokenRefresh(refreshCookie)
		if (!result) {
			return NextResponse.json(
				{ error: 'Refresh token inválido.' },
				{ status: 401 },
			)
		}

		const response = NextResponse.json({ message: 'Token atualizado.' })
		setAuthCookies(response, result.accessToken, result.refreshToken)
		return response
	} catch (error) {
		console.error('Erro ao atualizar token:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao atualizar token.' },
			{ status: 500 },
		)
	}
}
