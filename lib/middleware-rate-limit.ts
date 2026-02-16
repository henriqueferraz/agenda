/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rate limiting em memória para Next.js middleware (compatível com Edge Runtime).
 * Implementa sliding window counter por IP com limites diferenciados por tipo de rota.
 *
 * Limites configurados:
 * - Auth routes (/api/auth/*): 10 req/min
 * - API routes (/api/*): 60 req/min
 * - Páginas públicas: 120 req/min
 *
 * @example
 * import { checkMiddlewareRateLimit, getClientIp, getRouteCategory } from '@/lib/middleware-rate-limit'
 *
 * const ip = getClientIp(request)
 * const category = getRouteCategory('/api/auth/login')
 * const result = checkMiddlewareRateLimit(ip, category)
 * if (!result.allowed) return new Response('Too Many Requests', { status: 429 })
 */

/** Categorias de rotas com seus limites */
type RouteCategory = 'auth' | 'api' | 'public'

/** Resultado da verificação de rate limit */
interface RateLimitResult {
	/** Se a requisição é permitida */
	allowed: boolean
	/** Número de requisições restantes na janela */
	remaining: number
	/** Timestamp Unix (segundos) de quando a janela reseta */
	resetAt: number
}

/** Configuração de limite por categoria de rota */
interface RateLimitConfig {
	/** Máximo de requisições por janela */
	maxRequests: number
	/** Tamanho da janela em milissegundos */
	windowMs: number
}

/** Limites por categoria de rota */
const RATE_LIMITS: Record<RouteCategory, RateLimitConfig> = {
	/** Auth routes: 10 requisições por minuto */
	auth: { maxRequests: 10, windowMs: 60 * 1000 },
	/** API routes: 60 requisições por minuto */
	api: { maxRequests: 60, windowMs: 60 * 1000 },
	/** Páginas públicas: 120 requisições por minuto */
	public: { maxRequests: 120, windowMs: 60 * 1000 },
}

/** Estrutura de um bucket de rate limit */
interface RateBucket {
	/** Timestamps das requisições na janela atual */
	timestamps: number[]
}

/** Store em memória: chave (ip:category) → bucket */
const store = new Map<string, RateBucket>()

/** Timestamp da última limpeza global */
let lastGlobalCleanup = Date.now()

/** Intervalo de limpeza global em ms (a cada 2 minutos) */
const GLOBAL_CLEANUP_INTERVAL_MS = 2 * 60 * 1000

/**
 * Remove buckets expirados do store global.
 * Chamada de forma lazy para compatibilidade com Edge Runtime (sem setInterval).
 */
const cleanupStore = (): void => {
	const now = Date.now()
	if (now - lastGlobalCleanup < GLOBAL_CLEANUP_INTERVAL_MS) return
	lastGlobalCleanup = now

	const maxWindow = Math.max(...Object.values(RATE_LIMITS).map((c) => c.windowMs))
	for (const [key, bucket] of store) {
		const recent = bucket.timestamps.filter((t) => now - t < maxWindow)
		if (recent.length === 0) {
			store.delete(key)
		} else {
			bucket.timestamps = recent
		}
	}
}

/**
 * Extrai o IP do cliente da requisição, priorizando x-real-ip.
 *
 * @param request - Objeto Request do middleware
 * @returns Endereço IP do cliente ou 'unknown'
 *
 * @example
 * const ip = getClientIp(request) // '192.168.1.1'
 */
export const getClientIp = (request: Request): string => {
	const realIp = request.headers.get('x-real-ip')
	if (realIp) return realIp.trim()

	const forwardedFor = request.headers.get('x-forwarded-for')
	if (forwardedFor) return forwardedFor.split(',')[0].trim()

	return 'unknown'
}

/**
 * Determina a categoria de rate limit com base no pathname da URL.
 *
 * @param pathname - Pathname da URL (ex: '/api/auth/login')
 * @returns Categoria da rota: 'auth', 'api' ou 'public'
 *
 * @example
 * getRouteCategory('/api/auth/login')  // 'auth'
 * getRouteCategory('/api/webhook/appointment') // 'api'
 * getRouteCategory('/agendamento/abc123') // 'public'
 */
export const getRouteCategory = (pathname: string): RouteCategory => {
	if (pathname.startsWith('/api/auth')) return 'auth'
	if (pathname.startsWith('/api/')) return 'api'
	return 'public'
}

/**
 * Verifica o rate limit para um IP e categoria usando sliding window.
 * Remove timestamps fora da janela e adiciona o novo se permitido.
 *
 * @param ip - Endereço IP do cliente
 * @param category - Categoria da rota ('auth', 'api' ou 'public')
 * @returns Resultado com allowed, remaining e resetAt
 *
 * @example
 * const result = checkMiddlewareRateLimit('192.168.1.1', 'auth')
 * if (!result.allowed) {
 *   return new Response('Too Many Requests', { status: 429 })
 * }
 */
export const checkMiddlewareRateLimit = (
	ip: string,
	category: RouteCategory,
): RateLimitResult => {
	cleanupStore()

	const config = RATE_LIMITS[category]
	const key = `${ip}:${category}`
	const now = Date.now()
	const windowStart = now - config.windowMs

	let bucket = store.get(key)
	if (!bucket) {
		bucket = { timestamps: [] }
		store.set(key, bucket)
	}

	// Remove timestamps fora da janela
	bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart)

	const remaining = Math.max(0, config.maxRequests - bucket.timestamps.length)
	const resetAt = Math.ceil((now + config.windowMs) / 1000)

	if (bucket.timestamps.length >= config.maxRequests) {
		return { allowed: false, remaining: 0, resetAt }
	}

	bucket.timestamps.push(now)
	return { allowed: true, remaining: remaining - 1, resetAt }
}

/**
 * Reseta o store de rate limit. Apenas para uso em testes.
 *
 * @example
 * _resetRateLimitStore()
 */
export const _resetRateLimitStore = (): void => {
	store.clear()
}
