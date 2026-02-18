/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-17
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Rota GET /api/auth/refresh-bounce — renova tokens via redirect server-side.
 * Chamada pelo middleware quando o access token está expirado ou próximo de expirar.
 * Valida o refresh token, emite novo par de tokens, define cookies e redireciona
 * de volta para a URL original (returnTo). Se o refresh falhar, redireciona para login.
 *
 * Segurança: o parâmetro returnTo aceita apenas paths relativos (previne open redirect).
 *
 * @example
 * // Middleware redireciona para:
 * // GET /api/auth/refresh-bounce?returnTo=/dashboard/schedule/calendar
 * // Se refresh OK: 307 -> /dashboard/schedule/calendar (com novos cookies)
 * // Se refresh falha: 307 -> / (login)
 */
import { NextRequest, NextResponse } from 'next/server'
import { performTokenRefresh } from '@/lib/auth-refresh'
import { setAuthCookies } from '@/lib/auth-cookies'

/**
 * Valida que returnTo é um path relativo seguro (previne open redirect).
 * Aceita apenas paths que começam com / e não contêm // (evita protocol-relative URLs).
 *
 * @param returnTo - Valor do query parameter returnTo
 * @returns Path sanitizado ou '/dashboard' como fallback
 */
const sanitizeReturnTo = (returnTo: string | null): string => {
	if (!returnTo) return '/dashboard'
	if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return '/dashboard'
	return returnTo
}

/**
 * Handler GET para refresh-bounce. Lê refresh_token do cookie, executa o refresh
 * via performTokenRefresh, define novos cookies e redireciona para returnTo.
 *
 * @param request - Requisição com cookie refresh_token e query ?returnTo=
 * @returns NextResponse redirect para returnTo (sucesso) ou / (falha)
 */
export const GET = async (request: NextRequest) => {
	const returnTo = sanitizeReturnTo(
		request.nextUrl.searchParams.get('returnTo'),
	)

	const refreshCookie = request.cookies.get('refresh_token')?.value

	if (!refreshCookie) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	const result = await performTokenRefresh(refreshCookie)

	if (!result) {
		return NextResponse.redirect(new URL('/', request.url))
	}

	const response = NextResponse.redirect(new URL(returnTo, request.url))
	setAuthCookies(response, result.accessToken, result.refreshToken)
	return response
}
