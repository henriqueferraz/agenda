/**
 * API Route - /api/auth/register
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/register`.
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
 * import * as modulo from "@/app/api/auth/register/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { generateOtpCode, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { logSecurityEvent } from '@/lib/security-log'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const registerSchema = z.object({
	name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
	email: z.string().email('Email inválido').max(255),
	password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.').max(255),
})
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		const body = await request.json()
		const parsed = registerSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: parsed.error.issues[0]?.message || 'Dados inválidos.',
				},
				{ status: 400 },
			)
		}
		const passwordValidation = validatePasswordPolicy(parsed.data.password)
		if (!passwordValidation.valid) {
			return NextResponse.json(
				{ error: passwordValidation.message },
				{ status: 400 },
			)
		}
		const existing = await prisma.user.findUnique({
			where: { email: parsed.data.email },
		})
		if (existing) {
			return NextResponse.json(
				{
					error: 'Este email já está cadastrado.',
				},
				{ status: 409 },
			)
		}
		const password_hash = await hashPassword(parsed.data.password)
		const user = await prisma.user.create({
			data: {
				name: parsed.data.name,
				email: parsed.data.email,
				password_hash,
			},
		})
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
                <p>Olá ${parsed.data.name},</p>
                <p>Seu código de verificação é:</p>
                <h2>${otpCode}</h2>
                <p>Este código é válido por 15 minutos.</p>
            `,
		})
		await logSecurityEvent({
			userId: user.id,
			email: parsed.data.email,
			ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
			action: 'REGISTER_CREATED',
		})
		return NextResponse.json(
			{
				message: 'Conta criada. Verifique seu email com o código enviado.',
			},
			{ status: 201 },
		)
	} catch (error) {
		console.error('Erro ao registrar usuário:', error)
		return NextResponse.json(
			{
				error: 'Erro interno ao criar conta.',
			},
			{ status: 500 },
		)
	}
}
