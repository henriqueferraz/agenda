/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/auth/verify-otp: verificação de email com código OTP enviado no registro.
 * Valida email e código de 6 dígitos, marca OTP como usado, atualiza user.emailVerified
 * e registra evento de segurança; aplica bloqueio após várias tentativas inválidas.
 *
 * @example
 * const res = await fetch('/api/auth/verify-otp', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'usuario@exemplo.com', code: '123456' }),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashToken } from '@/lib/tokens'
import { logSecurityEvent } from '@/lib/security-log'

const verifySchema = z.object({
	email: z.string().email(),
	code: z.string().min(6).max(6),
})
const OTP_MAX_ATTEMPTS = 5
const OTP_LOCK_MINUTES = 10

/**
 * Handler POST para verificar código OTP de email. Valida email e código, marca OTP
 * como usado, define emailVerified no usuário e registra evento.
 *
 * @param request - Requisição com body JSON { email, code } (code 6 dígitos).
 * @returns NextResponse com message em 200 ou error em 400/429/500.
 */
export const POST = async (request: NextRequest) => {
	try {
		const body = await request.json()
		const parsed = verifySchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: parsed.error.issues[0]?.message || 'Dados inválidos.',
				},
				{ status: 400 },
			)
		}
		const now = new Date()
		const otpRecord = await prisma.emailOtp.findFirst({
			where: {
				email: parsed.data.email,
				usedAt: null,
				expiresAt: { gt: now },
			},
			orderBy: { createdAt: 'desc' },
		})
		if (!otpRecord) {
			return NextResponse.json(
				{
					error: 'Código inválido ou expirado.',
				},
				{ status: 400 },
			)
		}
		if (otpRecord.lockedUntil && otpRecord.lockedUntil > now) {
			return NextResponse.json(
				{
					error: 'Muitas tentativas. Aguarde alguns minutos.',
				},
				{ status: 429 },
			)
		}
		const codeHash = hashToken(parsed.data.code)
		const isValid = codeHash === otpRecord.codeHash
		if (!isValid) {
			const nextAttempts = otpRecord.attempts + 1
			const lockedUntil =
				nextAttempts >= OTP_MAX_ATTEMPTS
					? new Date(now.getTime() + OTP_LOCK_MINUTES * 60 * 1000)
					: null
			await prisma.emailOtp.update({
				where: { id: otpRecord.id },
				data: {
					attempts: nextAttempts,
					lockedUntil,
				},
			})
			return NextResponse.json(
				{
					error: 'Código inválido.',
				},
				{ status: 400 },
			)
		}
		await prisma.emailOtp.update({
			where: { id: otpRecord.id },
			data: { usedAt: now },
		})
		await prisma.user.update({
			where: { email: parsed.data.email },
			data: { emailVerified: now },
		})
		await logSecurityEvent({
			email: parsed.data.email,
			ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
			action: 'EMAIL_VERIFIED',
		})
		return NextResponse.json({ message: 'Email verificado com sucesso.' })
	} catch (error) {
		console.error('Erro ao verificar OTP:', error)
		return NextResponse.json(
			{
				error: 'Erro interno ao verificar código.',
			},
			{ status: 500 },
		)
	}
}
