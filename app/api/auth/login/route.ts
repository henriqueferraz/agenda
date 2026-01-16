/**
 * API Route - /api/auth/login
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/login`.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar entrada e preparar a resposta HTTP.
 * - Coordenar chamadas aos serviços internos.
 * - Garantir consistencia de erros e status.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/api/auth/login/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
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
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const loginSchema = z.object({
	email: z.string().email('Email inválido'),
	password: z.string().min(1, 'Senha obrigatória'),
})
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
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
