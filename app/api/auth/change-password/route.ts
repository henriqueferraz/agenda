/**
 * API Route - /api/auth/change-password
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/change-password`.
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
 * import * as modulo from "@/app/api/auth/change-password/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { verifyPassword, hashPassword } from '@/lib/password'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { logSecurityEvent } from '@/lib/security-log'
import { clearAuthCookies } from '@/lib/auth-cookies'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const changeSchema = z.object({
	currentPassword: z.string().min(1, 'Senha atual obrigatória'),
	newPassword: z.string().min(8, 'Nova senha muito curta').max(255),
})
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		const user = await getUserFromRequest(request)
		if (!user) {
			return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
		}
		const body = await request.json()
		const parsed = changeSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: parsed.error.issues[0]?.message || 'Dados inválidos.',
				},
				{ status: 400 },
			)
		}
		const validation = validatePasswordPolicy(parsed.data.newPassword)
		if (!validation.valid) {
			return NextResponse.json({ error: validation.message }, { status: 400 })
		}
		const fullUser = await prisma.user.findUnique({
			where: { id: user.id },
		})
		if (!fullUser?.password_hash) {
			return NextResponse.json(
				{ error: 'Senha não configurada.' },
				{ status: 400 },
			)
		}
		const valid = await verifyPassword(
			parsed.data.currentPassword,
			fullUser.password_hash,
		)
		if (!valid) {
			return NextResponse.json(
				{ error: 'Senha atual inválida.' },
				{ status: 400 },
			)
		}
		const newHash = await hashPassword(parsed.data.newPassword)
		await prisma.user.update({
			where: { id: user.id },
			data: { password_hash: newHash },
		})
		await prisma.refreshToken.updateMany({
			where: { userId: user.id, revokedAt: null },
			data: { revokedAt: new Date() },
		})
		await logSecurityEvent({
			userId: user.id,
			email: user.email || undefined,
			ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
			action: 'PASSWORD_CHANGED',
		})
		const response = NextResponse.json({
			message: 'Senha atualizada com sucesso. Faça login novamente.',
		})
		clearAuthCookies(response)
		return response
	} catch (error) {
		console.error('Erro ao alterar senha:', error)
		return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
	}
}
