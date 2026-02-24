/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/auth/reset-password: redefine a senha usando o token recebido por email.
 * Valida token, política de senha, atualiza a senha do usuário, invalida o token e
 * revoga refresh tokens; registra evento de segurança.
 *
 * @example
 * const res = await fetch('/api/auth/reset-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ token: '...', password: 'NovaSenha123!' }),
 * });
 * const data = await res.json(); // { message: 'Senha atualizada com sucesso.' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { hashToken } from '@/lib/tokens'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { logSecurityEvent } from '@/lib/security-log'
import { checkIpRateLimit } from '@/lib/rate-limit'

const resetSchema = z.object({
	token: z.string().min(10),
	password: z
		.string()
		.min(8, 'A senha deve ter no mínimo 8 caracteres.')
		.max(255),
})

/**
 * Handler POST: recebe token de reset e nova senha; atualiza senha e invalida token.
 *
 * @param request - Requisição com body JSON { token: string, password: string }
 * @returns NextResponse com { message } em sucesso ou { error } e status 400/404/500
 */
export const POST = async (request: NextRequest) => {
	try {
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
		const parsed = resetSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: parsed.error.issues[0]?.message || 'Dados inválidos.',
				},
				{ status: 400 },
			)
		}
		const validation = validatePasswordPolicy(parsed.data.password)
		if (!validation.valid) {
			return NextResponse.json({ error: validation.message }, { status: 400 })
		}
		const tokenHash = hashToken(parsed.data.token)
		const reset = await prisma.passwordResetToken.findFirst({
			where: {
				tokenHash,
				usedAt: null,
				expiresAt: { gt: new Date() },
			},
		})
		if (!reset) {
			return NextResponse.json(
				{ error: 'Token inválido ou expirado.' },
				{ status: 400 },
			)
		}
		const password_hash = await hashPassword(parsed.data.password)
		const user = await prisma.user.findUnique({ where: { email: reset.email } })
		if (!user) {
			return NextResponse.json(
				{ error: 'Usuário não encontrado.' },
				{ status: 404 },
			)
		}
		await prisma.user.update({
			where: { email: reset.email },
			data: { password_hash },
		})
		await prisma.passwordResetToken.update({
			where: { id: reset.id },
			data: { usedAt: new Date() },
		})
		await prisma.refreshToken.updateMany({
			where: { userId: user.id, revokedAt: null },
			data: { revokedAt: new Date() },
		})
		await logSecurityEvent({
			userId: user.id,
			email: user.email,
			ip,
			action: 'PASSWORD_RESET_SUCCESS',
		})
		return NextResponse.json({ message: 'Senha atualizada com sucesso.' })
	} catch (error) {
		console.error('Erro ao resetar senha:', error)
		return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
	}
}
