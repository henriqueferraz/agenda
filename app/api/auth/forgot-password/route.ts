/**
 * Rota POST /api/auth/forgot-password: solicita redefinição de senha por email.
 * Valida o email, gera um token de reset, persiste no banco, envia o link por email
 * e registra o evento de segurança. Resposta sempre genérica (não revela se o email existe).
 *
 * @example
 * const res = await fetch('/api/auth/forgot-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'usuario@exemplo.com' }),
 * });
 * const data = await res.json(); // { message: 'Se o email existir, enviaremos...' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateRandomToken, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { logSecurityEvent } from '@/lib/security-log'

const forgotSchema = z.object({
	email: z.string().email('Email inválido'),
})

/**
 * Handler POST: recebe email e inicia fluxo de redefinição de senha (token + email).
 *
 * @param request - Requisição contendo body JSON com { email: string }
 * @returns NextResponse com { message } em sucesso ou { error } e status 400/500
 */
export const POST = async (request: NextRequest) => {
	try {
		const body = await request.json()
		const parsed = forgotSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: parsed.error.issues[0]?.message || 'Dados inválidos.',
				},
				{ status: 400 },
			)
		}
		const user = await prisma.user.findUnique({
			where: { email: parsed.data.email },
		})
		if (user) {
			const token = generateRandomToken(32)
			const tokenHash = hashToken(token)
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
			await prisma.passwordResetToken.create({
				data: {
					email: parsed.data.email,
					tokenHash,
					expiresAt,
				},
			})
			const baseUrl =
				process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
			const resetUrl = `${baseUrl}/reset-password?token=${token}`
			await sendEmail({
				to: parsed.data.email,
				subject: 'Redefinição de senha',
				html: `
                    <p>Você solicitou a redefinição de senha.</p>
                    <p>Clique no link abaixo para criar uma nova senha:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>O link expira em 15 minutos.</p>
                `,
			})
			await logSecurityEvent({
				userId: user.id,
				email: user.email,
				ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
				action: 'PASSWORD_RESET_REQUEST',
			})
		}
		return NextResponse.json({
			message: 'Se o email existir, enviaremos um link de redefinição.',
		})
	} catch (error) {
		console.error('Erro ao solicitar reset de senha:', error)
		return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
	}
}
