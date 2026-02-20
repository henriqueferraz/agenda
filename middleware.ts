/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Next.js middleware com rate limiting global, refresh automatico de sessao
 * e verificacao de trial para usuarios enterprise.
 *
 * 1. Rate limiting diferenciado por tipo de rota (auth, api, public).
 * 2. Para rotas protegidas (/dashboard/*): verifica se o access token esta
 *    expirado ou proximo de expirar e redireciona para /api/auth/refresh-bounce
 *    quando o refresh token existe (renovacao transparente de sessao).
 * 3. Verifica trial: se usuario enterprise tem trial expirado, redireciona
 *    para /dashboard/upgrade (exceto a propria pagina e rotas admin).
 *
 * @example
 * // O middleware é executado automaticamente pelo Next.js.
 * // Headers adicionados: X-RateLimit-Remaining, X-RateLimit-Reset
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	checkMiddlewareRateLimit,
	getClientIp,
	getRouteCategory,
} from '@/lib/middleware-rate-limit'

/** Margem de seguranca para renovacao antecipada do token (5 minutos em segundos). */
const REFRESH_THRESHOLD_S = 5 * 60

/**
 * Decodifica o payload de um JWT via base64 (sem verificar assinatura).
 * Compativel com Edge Runtime — usa apenas atob() nativo.
 *
 * @param token - JWT no formato header.payload.signature
 * @returns Payload decodificado ou null se invalido
 */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null
		return JSON.parse(
			atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
		)
	} catch {
		return null
	}
}

/**
 * Verifica se uma rota e protegida (requer autenticacao).
 * Rotas do dashboard sao protegidas; rotas publicas e API nao.
 *
 * @param pathname - Pathname da requisicao
 * @returns true se a rota requer autenticacao
 */
const isProtectedRoute = (pathname: string): boolean => {
	return pathname.startsWith('/dashboard')
}

/**
 * Verifica se a rota deve ser ignorada pelo auth check (evita loops de redirect).
 *
 * @param pathname - Pathname da requisicao
 * @returns true se a rota deve ser ignorada
 */
const isAuthBypassRoute = (pathname: string): boolean => {
	return pathname.startsWith('/api/auth/')
}

/** Rotas isentas de verificacao de trial (sempre acessiveis). */
const TRIAL_EXEMPT_ROUTES = [
	'/dashboard/upgrade',
	'/dashboard/admin',
]

/**
 * Verifica se a rota esta isenta da verificacao de trial.
 *
 * @param pathname - Pathname da requisicao
 * @returns true se a rota nao deve verificar trial
 */
const isTrialExemptRoute = (pathname: string): boolean => {
	return TRIAL_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Middleware principal: aplica rate limiting, refresh automatico de sessao
 * e verificacao de trial.
 *
 * Fluxo para rotas protegidas:
 * 1. Se access token valido e distante da expiracao: verifica trial e passa
 * 2. Se access token expirado/proximo de expirar + refresh token existe + GET: redirect para bounce
 * 3. Se sem tokens validos + GET: redirect para login (/)
 * 4. Se POST/PUT/DELETE com token expirado: passa direto (server action trata via getUserFromToken)
 * 5. Se trial expirado (enterprise): redirect para /dashboard/upgrade
 *
 * @param request - Requisicao Next.js
 * @returns NextResponse com headers de rate limit, redirect para bounce/login/upgrade, ou 429
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
		const payload = authToken ? decodeJwtPayload(authToken) : null
		const exp = typeof payload?.exp === 'number' ? payload.exp : null
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

		if (tokenValid && payload && !isTrialExemptRoute(pathname)) {
			const role = payload.role as string | undefined
			const trialEndsAt = payload.trialEndsAt as string | undefined

			if (role === 'enterprise' && trialEndsAt) {
				const trialEnd = new Date(trialEndsAt).getTime()
				if (trialEnd <= Date.now()) {
					if (request.method === 'GET') {
						return NextResponse.redirect(
							new URL('/dashboard/upgrade', request.url),
						)
					}
				}
			}
		}
	}

	const response = NextResponse.next()
	response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
	response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt))

	return response
}

/**
 * Configuracao do matcher: quais rotas o middleware intercepta.
 * Exclui arquivos estaticos (_next, imagens, fontes, favicon).
 */
export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
	],
}
