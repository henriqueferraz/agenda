/**
 * API Route - /api/auth/reset-password
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/reset-password`.
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
 * import * as modulo from "@/app/api/auth/reset-password/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { hashToken } from '@/lib/tokens'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { logSecurityEvent } from '@/lib/security-log'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const resetSchema = z.object({
	token: z.string().min(10),
	password: z
		.string()
		.min(8, 'A senha deve ter no mínimo 8 caracteres.')
		.max(255),
})
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
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
			ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
			action: 'PASSWORD_RESET_SUCCESS',
		})
		return NextResponse.json({ message: 'Senha atualizada com sucesso.' })
	} catch (error) {
		console.error('Erro ao resetar senha:', error)
		return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
	}
}
