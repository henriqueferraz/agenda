/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Next.js middleware com rate limiting global e refresh automático de sessão.
 *
 * 1. Rate limiting diferenciado por tipo de rota (auth, api, public).
 * 2. Para rotas protegidas (/dashboard/*): verifica se o access token está
 *    expirado ou próximo de expirar e redireciona para /api/auth/refresh-bounce
 *    quando o refresh token existe (renovação transparente de sessão).
 *
 * Limites de rate limit:
 * - Auth routes (/api/auth/*): 10 req/min
 * - API routes (/api/*): 60 req/min
 * - Páginas públicas: 120 req/min
 *
 * @example
 * // O middleware é executado automaticamente pelo Next.js.
 * // Headers adicionados: X-RateLimit-Remaining, X-RateLimit-Reset
 * // Refresh automático: redireciona para bounce route quando necessário
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	checkMiddlewareRateLimit,
	getClientIp,
	getRouteCategory,
} from '@/lib/middleware-rate-limit'

/** Margem de segurança para renovação antecipada do token (5 minutos em segundos). */
const REFRESH_THRESHOLD_S = 5 * 60

/**
 * Decodifica o payload de um JWT via base64 (sem verificar assinatura).
 * Compatível com Edge Runtime — usa apenas atob() nativo.
 *
 * @param token - JWT no formato header.payload.signature
 * @returns Campo `exp` (Unix timestamp em segundos) ou null se inválido
 */
const getTokenExp = (token: string): number | null => {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null
		const payload = JSON.parse(
			atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
		)
		return typeof payload.exp === 'number' ? payload.exp : null
	} catch {
		return null
	}
}

/**
 * Verifica se uma rota é protegida (requer autenticação).
 * Rotas do dashboard são protegidas; rotas públicas e API não.
 *
 * @param pathname - Pathname da requisição
 * @returns true se a rota requer autenticação
 */
const isProtectedRoute = (pathname: string): boolean => {
	return pathname.startsWith('/dashboard')
}

/**
 * Verifica se a rota deve ser ignorada pelo auth check (evita loops de redirect).
 *
 * @param pathname - Pathname da requisição
 * @returns true se a rota deve ser ignorada
 */
const isAuthBypassRoute = (pathname: string): boolean => {
	return pathname.startsWith('/api/auth/')
}

/**
 * Middleware principal: aplica rate limiting e refresh automático de sessão.
 *
 * Fluxo para rotas protegidas:
 * 1. Se access token válido e distante da expiração: passa direto
 * 2. Se access token expirado/próximo de expirar + refresh token existe + GET: redirect para bounce
 * 3. Se sem tokens válidos + GET: redirect para login (/)
 * 4. Se POST/PUT/DELETE com token expirado: passa direto (server action trata via getUserFromToken)
 *
 * @param request - Requisição Next.js
 * @returns NextResponse com headers de rate limit, redirect para bounce/login, ou 429
 */
export const middleware = (request: NextRequest): NextResponse => {
	const { pathname } = request.nextUrl

	const ip = getClientIp(request)
	const category = getRouteCategory(pathname)
	const rateLimitResult = checkMiddlewareRateLimit(ip, category)

	if (!rateLimitResult.allowed) {
		return new NextResponse(
			JSON.stringify({ error: 'Muitas requisições. Tente novamente em breve.' }),
			{
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(rateLimitResult.resetAt),
					'Retry-After': '60',
				},
			},
		)
	}

	if (isProtectedRoute(pathname) && !isAuthBypassRoute(pathname)) {
		const authToken = request.cookies.get('auth_token')?.value
		const refreshToken = request.cookies.get('refresh_token')?.value

		const nowS = Math.floor(Date.now() / 1000)
		const exp = authToken ? getTokenExp(authToken) : null
		const tokenValid = exp !== null && exp > nowS + REFRESH_THRESHOLD_S

		if (!tokenValid) {
			if (refreshToken && request.method === 'GET') {
				const returnTo = pathname + request.nextUrl.search
				const bounceUrl = new URL(
					`/api/auth/refresh-bounce?returnTo=${encodeURIComponent(returnTo)}`,
					request.url,
				)
				return NextResponse.redirect(bounceUrl)
			}

			if (request.method === 'GET') {
				return NextResponse.redirect(new URL('/', request.url))
			}
		}
	}

	const response = NextResponse.next()
	response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
	response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt))

	return response
}

/**
 * Configuração do matcher: quais rotas o middleware intercepta.
 * Exclui arquivos estáticos (_next, imagens, fontes, favicon).
 */
export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
	],
}
