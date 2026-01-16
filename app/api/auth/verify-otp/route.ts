/**
 * API Route - /api/auth/verify-otp
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/verify-otp`.
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
 * import * as modulo from "@/app/api/auth/verify-otp/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashToken } from '@/lib/tokens'
import { logSecurityEvent } from '@/lib/security-log'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const verifySchema = z.object({
	email: z.string().email(),
	code: z.string().min(6).max(6),
})
const OTP_MAX_ATTEMPTS = 5
const OTP_LOCK_MINUTES = 10
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
