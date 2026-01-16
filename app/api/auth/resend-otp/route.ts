/**
 * API Route - /api/auth/resend-otp
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/resend-otp`.
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
 * import * as modulo from "@/app/api/auth/resend-otp/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateOtpCode, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const resendSchema = z.object({
	email: z.string().email(),
})
const OTP_RESEND_COOLDOWN_MS = 60 * 1000
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
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
			return NextResponse.json(
				{
					error: 'Usuário não encontrado.',
				},
				{ status: 404 },
			)
		}
		if (user.emailVerified) {
			return NextResponse.json(
				{
					error: 'Email já verificado.',
				},
				{ status: 400 },
			)
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
