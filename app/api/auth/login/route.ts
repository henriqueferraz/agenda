/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/auth/login: autenticação com email e senha. Valida rate limit por IP,
 * credenciais, status do usuário e email verificado; emite access e refresh token,
 * persiste refresh no banco, define cookies e registra evento de segurança.
 *
 * @example
 * const res = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   credentials: 'include',
 *   body: JSON.stringify({ email: 'usuario@exemplo.com', password: 'Senha123!' }),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { setAuthCookies } from '@/lib/auth-cookies'
import { hashToken } from '@/lib/tokens'
import {
	checkIpRateLimit,
	getLoginAttempt,
	recordLoginFailure,
	recordLoginSuccess,
} from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/security-log'

const loginSchema = z.object({
	email: z.string().email('Email inválido'),
	password: z.string().min(1, 'Senha obrigatória'),
})

/**
 * Handler POST para login. Valida rate limit, body (email/senha), bloqueio por tentativas,
 * credenciais, email verificado e status; emite tokens, persiste refresh e define cookies.
 *
 * @param request - Requisição com body JSON { email, password } e cookies para resposta.
 * @returns NextResponse com message e Set-Cookie em 200, ou error em 400/401/403/429/500.
 */
export const POST = async (request: NextRequest) => {
	try {
		// Prioriza x-real-ip (definido pelo reverse proxy) para evitar spoofing via x-forwarded-for
		const ip =
			request.headers.get('x-real-ip') ||
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			'unknown'
		const rateLimit = await checkIpRateLimit(ip)
		if (!rateLimit.allowed) {
			return NextResponse.json(
				{
					error: 'Muitas tentativas. Tente novamente mais tarde.',
					blockedUntil: rateLimit.blockedUntil,
				},
				{ status: 429 },
			)
		}
		const body = await request.json()
		const parsed = loginSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: parsed.error.issues[0]?.message || 'Dados inválidos.',
				},
				{ status: 400 },
			)
		}
		const attempt = await getLoginAttempt(parsed.data.email)
		const now = new Date()
		if (attempt?.lockedUntil && attempt.lockedUntil <= now) {
			await recordLoginSuccess(parsed.data.email)
		}
		if (attempt?.lockedUntil && attempt.lockedUntil > now) {
			await logSecurityEvent({
				email: parsed.data.email,
				ip,
				action: 'LOGIN_BLOCKED',
				metadata: { lockedUntil: attempt.lockedUntil },
			})
			return NextResponse.json(
				{
					error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.',
					lockedUntil: attempt.lockedUntil,
				},
				{ status: 429 },
			)
		}
		const user = await prisma.user.findUnique({
			where: { email: parsed.data.email },
		})
		if (!user || !user.password_hash) {
			await recordLoginFailure(parsed.data.email)
			await logSecurityEvent({
				email: parsed.data.email,
				ip,
				action: 'LOGIN_FAILED',
			})
			return NextResponse.json(
				{ error: 'Credenciais inválidas.' },
				{ status: 401 },
			)
		}
		if (!user.emailVerified) {
			await logSecurityEvent({
				userId: user.id,
				email: user.email,
				ip,
				action: 'LOGIN_UNVERIFIED_EMAIL',
			})
			return NextResponse.json(
				{ error: 'Email não verificado.' },
				{ status: 403 },
			)
		}
		if (user.status === false) {
			await logSecurityEvent({
				userId: user.id,
				email: user.email,
				ip,
				action: 'LOGIN_BLOCKED_USER',
			})
			return NextResponse.json({ error: 'Usuário inativo.' }, { status: 403 })
		}
		const valid = await verifyPassword(parsed.data.password, user.password_hash)
		if (!valid) {
			const lockedUntil = await recordLoginFailure(parsed.data.email)
			await logSecurityEvent({
				userId: user.id,
				email: user.email,
				ip,
				action: 'LOGIN_FAILED',
				metadata: { lockedUntil },
			})
			return NextResponse.json(
				{
					error: 'Credenciais inválidas.',
					lockedUntil,
				},
				{ status: 401 },
			)
		}
		await recordLoginSuccess(parsed.data.email)
		const payload = { sub: user.id, email: user.email, name: user.name }
		const accessToken = signAccessToken(payload)
		const refreshToken = signRefreshToken(payload)
		const refreshHash = hashToken(refreshToken)
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: refreshHash,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		})
		await logSecurityEvent({
			userId: user.id,
			email: user.email,
			ip,
			action: 'LOGIN_SUCCESS',
		})
		const response = NextResponse.json({
			message: 'Login realizado com sucesso.',
		})
		setAuthCookies(response, accessToken, refreshToken)
		return response
	} catch (error) {
		console.error('Erro ao fazer login:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao fazer login.' },
			{ status: 500 },
		)
	}
}
