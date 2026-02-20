/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/auth/register: cria conta com nome, email, CPF e senha.
 * Valida politica de senha, unicidade de email e CPF, persiste usuario com
 * role enterprise e trialEndsAt (30 dias), gera OTP de verificacao e envia email.
 *
 * @example
 * const res = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'João', email: 'joao@exemplo.com', cpf: '12345678909', password: 'Senha123!' }),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { generateOtpCode, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { logSecurityEvent } from '@/lib/security-log'
import { isCPFValid, unformatCPF } from '@/utils/formatCPF'

/** Duracao do trial em milissegundos (30 dias) */
const TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000

const registerSchema = z.object({
	name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
	email: z.string().email('Email inválido').max(255),
	cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
	password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.').max(255),
})

/**
 * Handler POST para registro de novo usuario. Valida body (nome, email, CPF, senha),
 * politica de senha, CPF via algoritmo oficial, unicidade de email e CPF no banco,
 * cria usuario com role enterprise e trial de 30 dias, gera OTP e envia email.
 *
 * @param request - Requisicao contendo JSON com name, email, cpf e password.
 * @returns NextResponse com message em 201 ou error e status 400/409/500.
 */
export const POST = async (request: NextRequest) => {
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

		const cleanCpf = unformatCPF(parsed.data.cpf)

		if (!isCPFValid(cleanCpf)) {
			return NextResponse.json(
				{ error: 'CPF inválido.' },
				{ status: 400 },
			)
		}

		const normalizedEmail = parsed.data.email.trim().toLowerCase()
		const normalizedName = parsed.data.name.trim()

		const existingByEmail = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		})
		if (existingByEmail) {
			return NextResponse.json(
				{ error: 'Este email já está cadastrado.' },
				{ status: 409 },
			)
		}

		const existingByCpf = await prisma.user.findUnique({
			where: { cpf: cleanCpf },
		})
		if (existingByCpf) {
			return NextResponse.json(
				{ error: 'Este CPF já está cadastrado.' },
				{ status: 409 },
			)
		}

		const password_hash = await hashPassword(parsed.data.password)
		const otpCode = generateOtpCode()
		const otpHash = hashToken(otpCode)
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

		const user = await prisma.user.create({
			data: {
				name: normalizedName,
				email: normalizedEmail,
				cpf: cleanCpf,
				password_hash,
				role: 'enterprise',
				trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
			},
		})
		await prisma.emailOtp.create({
			data: {
				email: normalizedEmail,
				codeHash: otpHash,
				expiresAt,
				lastSentAt: new Date(),
			},
		})
		try {
			await sendEmail({
				to: normalizedEmail,
				subject: 'Seu código de verificação',
				html: `
                <p>Olá ${normalizedName},</p>
                <p>Seu código de verificação é:</p>
                <h2>${otpCode}</h2>
                <p>Este código é válido por 15 minutos.</p>
            `,
			})
		} catch (error) {
			console.error('Erro ao enviar email de verificação:', error)
			await prisma.$transaction([
				prisma.emailOtp.deleteMany({
					where: { email: normalizedEmail },
				}),
				prisma.user.delete({
					where: { id: user.id },
				}),
			])
			return NextResponse.json(
				{
					error:
						'Falha ao enviar o email de verificação. Verifique as configurações de email e tente novamente.',
				},
				{ status: 500 },
			)
		}
		await logSecurityEvent({
			userId: user.id,
			email: normalizedEmail,
			ip: request.headers.get('x-real-ip') ||
				request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
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
