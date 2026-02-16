/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Next.js middleware com rate limiting global diferenciado por tipo de rota.
 * Executa antes de cada requisição, adicionando headers de rate limit e
 * retornando 429 quando o limite é excedido.
 *
 * Limites:
 * - Auth routes (/api/auth/*): 10 req/min
 * - API routes (/api/*): 60 req/min
 * - Páginas públicas: 120 req/min
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

/**
 * Middleware principal: aplica rate limiting por IP e categoria de rota.
 * Adiciona headers de rate limit em todas as respostas.
 * Retorna 429 Too Many Requests quando o limite é excedido.
 *
 * @param request - Requisição Next.js
 * @returns NextResponse com headers de rate limit ou 429 se bloqueado
 */
export const middleware = (request: NextRequest): NextResponse => {
	const ip = getClientIp(request)
	const category = getRouteCategory(request.nextUrl.pathname)
	const result = checkMiddlewareRateLimit(ip, category)

	if (!result.allowed) {
		return new NextResponse(
			JSON.stringify({ error: 'Muitas requisições. Tente novamente em breve.' }),
			{
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(result.resetAt),
					'Retry-After': '60',
				},
			},
		)
	}

	const response = NextResponse.next()
	response.headers.set('X-RateLimit-Remaining', String(result.remaining))
	response.headers.set('X-RateLimit-Reset', String(result.resetAt))

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
