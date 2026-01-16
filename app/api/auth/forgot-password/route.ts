/**
 * API Route - /api/auth/forgot-password
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/forgot-password`.
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
 * import * as modulo from "@/app/api/auth/forgot-password/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateRandomToken, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { logSecurityEvent } from '@/lib/security-log'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const forgotSchema = z.object({
	email: z.string().email('Email inválido'),
})
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
