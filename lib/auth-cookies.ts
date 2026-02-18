/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Modulo de cookies de autenticacao - Set e clear de tokens JWT
 *
 * Gerencia cookies httpOnly para access e refresh tokens.
 * Configuracao segura: httpOnly, secure em producao, SameSite=Lax.
 *
 * @example
 * import { setAuthCookies, clearAuthCookies } from '@/lib/auth-cookies'
 *
 * setAuthCookies(response, accessToken, refreshToken)
 * clearAuthCookies(response)
 */
import { NextResponse } from 'next/server'
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from './jwt'

/** Opcoes padrao de seguranca para cookies de autenticacao */
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
}

/**
 * Define os cookies de autenticacao (auth_token e refresh_token) na resposta.
 * @param response - Objeto NextResponse onde os cookies serao definidos
 * @param accessToken - Token JWT de acesso (expira em 30min)
 * @param refreshToken - Token JWT de refresh (expira em 24h)
 * @example
 * const response = NextResponse.json({ success: true })
 * setAuthCookies(response, accessToken, refreshToken)
 */
export const setAuthCookies = (
	response: NextResponse,
	accessToken: string,
	refreshToken: string,
) => {
	response.cookies.set('auth_token', accessToken, {
		...COOKIE_OPTIONS,
		maxAge: ACCESS_TOKEN_MAX_AGE,
	})
	response.cookies.set('refresh_token', refreshToken, {
		...COOKIE_OPTIONS,
		maxAge: REFRESH_TOKEN_MAX_AGE,
	})
}

/**
 * Remove os cookies de autenticacao da resposta (logout).
 * @param response - Objeto NextResponse onde os cookies serao limpos
 * @example
 * const response = NextResponse.json({ success: true })
 * clearAuthCookies(response)
 */
export const clearAuthCookies = (response: NextResponse) => {
	response.cookies.set('auth_token', '', {
		...COOKIE_OPTIONS,
		maxAge: 0,
	})
	response.cookies.set('refresh_token', '', {
		...COOKIE_OPTIONS,
		maxAge: 0,
	})
}
