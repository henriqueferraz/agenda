/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * API Route - POST /api/auth/resend-otp
 *
 * Reenvia codigo OTP por email para verificacao de conta.
 * Valida email, verifica cooldown de 60s, gera novo OTP e envia por email.
 *
 * @example
 * const res = await fetch('/api/auth/resend-otp', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@email.com' }),
 * })
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateOtpCode, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { checkIpRateLimit } from '@/lib/rate-limit'

const resendSchema = z.object({
	email: z.string().email(),
})
const OTP_RESEND_COOLDOWN_MS = 60 * 1000

/**
 * Handler POST para reenviar código OTP. Valida email, verifica usuário não verificado,
 * cooldown; cria novo OTP, envia email e retorna mensagem de sucesso.
 *
 * @param request - Requisição com body JSON { email }.
 * @returns NextResponse com message em 200 ou error em 400/404/429/500.
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
		const parsed = resendSchema.safeParse(body)
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
		if (!user) {
			return NextResponse.json({
				message: 'Se o email existir, um novo código será enviado.',
			})
		}
		if (user.emailVerified) {
			return NextResponse.json({
				message: 'Se o email existir, um novo código será enviado.',
			})
		}
		const latest = await prisma.emailOtp.findFirst({
			where: { email: parsed.data.email },
			orderBy: { createdAt: 'desc' },
		})
		if (latest) {
			const nextAllowed = new Date(
				latest.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS,
			)
			if (nextAllowed > new Date()) {
				return NextResponse.json(
					{
						error: 'Aguarde alguns segundos para reenviar o código.',
					},
					{ status: 429 },
				)
			}
		}
		const otpCode = generateOtpCode()
		const otpHash = hashToken(otpCode)
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
		await prisma.emailOtp.create({
			data: {
				email: parsed.data.email,
				codeHash: otpHash,
				expiresAt,
				lastSentAt: new Date(),
			},
		})
		await sendEmail({
			to: parsed.data.email,
			subject: 'Seu código de verificação',
			html: `
                <p>Seu novo código de verificação é:</p>
                <h2>${otpCode}</h2>
                <p>Este código é válido por 15 minutos.</p>
            `,
		})
		return NextResponse.json({ message: 'Código reenviado com sucesso.' })
	} catch (error) {
		console.error('Erro ao reenviar OTP:', error)
		return NextResponse.json(
			{
				error: 'Erro interno ao reenviar código.',
			},
			{ status: 500 },
		)
	}
}
