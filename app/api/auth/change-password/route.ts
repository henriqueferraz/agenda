/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/auth/change-password: alteração de senha para usuário autenticado.
 * Valida senha atual, política da nova senha, atualiza hash no banco, revoga refresh
 * tokens, limpa cookies e registra evento de segurança.
 *
 * @example
 * const res = await fetch('/api/auth/change-password', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   credentials: 'include',
 *   body: JSON.stringify({ currentPassword: 'Atual123!', newPassword: 'NovaSenha123!' }),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { verifyPassword, hashPassword } from '@/lib/password'
import { validatePasswordPolicy } from '@/lib/password-policy'
import { logSecurityEvent } from '@/lib/security-log'
import { clearAuthCookies } from '@/lib/auth-cookies'

const changeSchema = z.object({
	currentPassword: z.string().min(1, 'Senha atual obrigatória'),
	newPassword: z
		.string()
		.min(8, 'A senha deve ter no mínimo 8 caracteres.')
		.max(255),
})

/**
 * Handler POST para alterar senha. Exige usuário autenticado; valida senha atual,
 * política da nova, atualiza hash, revoga tokens e limpa cookies.
 *
 * @param request - Requisição autenticada com body JSON { currentPassword, newPassword }.
 * @returns NextResponse com message em 200 ou error em 400/401/500; cookies limpos em sucesso.
 */
export const POST = async (request: NextRequest) => {
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
