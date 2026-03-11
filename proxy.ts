/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Next.js proxy com rate limiting global, refresh automático de sessão
 * e verificação de trial para usuários enterprise.
 *
 * @example
 * // O proxy é executado automaticamente pelo Next.js.
 * // Headers adicionados: X-RateLimit-Remaining, X-RateLimit-Reset
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	checkMiddlewareRateLimit,
	getClientIp,
	getRouteCategory,
} from '@/lib/middleware-rate-limit'

const REFRESH_THRESHOLD_S = 5 * 60

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

const isProtectedRoute = (pathname: string): boolean => {
	return pathname.startsWith('/dashboard')
}

const isAuthBypassRoute = (pathname: string): boolean => {
	return pathname.startsWith('/api/auth/')
}

const TRIAL_EXEMPT_ROUTES = ['/dashboard/upgrade', '/dashboard/admin']

const isTrialExemptRoute = (pathname: string): boolean => {
	return TRIAL_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Proxy principal: aplica rate limiting, refresh automático de sessão
 * e verificação de trial.
 *
 * @param request - Requisição Next.js
 * @returns NextResponse com headers de rate limit, redirect para bounce/login/upgrade, ou 429
 */
export const proxy = (request: NextRequest): NextResponse => {
	const { pathname } = request.nextUrl

	// Log para debug de rotas de agendamento
	if (pathname.startsWith('/agendamento')) {
		console.log('proxy: Requisição para rota de agendamento (PÚBLICA)', {
			pathname,
			method: request.method,
			userAgent: request.headers.get('user-agent'),
			hasAuthCookie: !!request.cookies.get('auth_token'),
			timestamp: new Date().toISOString(),
		})
	}

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

	// Rotas públicas não precisam de autenticação (agendamento público, login, etc)
	// IMPORTANTE: Estas rotas são totalmente públicas e não requerem autenticação
	const isPublicRoute = pathname.startsWith('/agendamento') || 
		pathname.startsWith('/login') || 
		pathname.startsWith('/register') ||
		pathname.startsWith('/forgot-password') ||
		pathname.startsWith('/reset-password') ||
		pathname === '/'

	// Se for rota pública, retorna imediatamente sem verificar autenticação
	// IMPORTANTE: Rotas públicas não requerem autenticação e devem passar direto
	if (isPublicRoute) {
		if (pathname.startsWith('/agendamento')) {
			console.log('proxy: Rota pública de agendamento - permitindo acesso sem autenticação', {
				pathname,
				rateLimitRemaining: rateLimitResult.remaining,
			})
		}
		const response = NextResponse.next()
		response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
		response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetAt))
		return response
	}

	// Apenas rotas protegidas precisam de autenticação
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

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
	],
}
