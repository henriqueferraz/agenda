/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Server action para resetar a senha de um usuario enterprise.
 * Exclusiva para usuarios com role master. Gera um PasswordResetToken,
 * envia email com link de redefinicao e registra evento de seguranca.
 *
 * @example
 * import { resetUserPassword } from './_actions/reset-user-password'
 * const result = await resetUserPassword('target_user_id')
 */
'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { generateRandomToken, hashToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { logSecurityEvent } from '@/lib/security-log'

/** Tempo de expiracao do token de reset em milissegundos (15 minutos) */
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000

const resetPasswordSchema = z.object({
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
})

/**
 * Gera token de reset de senha e envia email ao usuario enterprise.
 * Reutiliza o modelo PasswordResetToken e o fluxo existente de `/reset-password`.
 *
 * @param userId - ID do usuario enterprise cuja senha sera resetada
 * @returns Objeto com success e message, ou error
 *
 * @example
 * const result = await resetUserPassword('cmk069h7v0001o1ui1234abcd')
 * if (result.success) console.log(result.message)
 */
export const resetUserPassword = async (userId: string) => {
	try {
		const session = await getUserFromToken()
		if (!session) {
			return { success: false, error: 'Não autenticado.' }
		}

		if (session.role !== 'master') {
			return { success: false, error: 'Acesso negado. Somente administradores.' }
		}

		const parsed = resetPasswordSchema.safeParse({ userId })
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
		}

		const targetUser = await prisma.user.findUnique({
			where: { id: parsed.data.userId },
			select: { id: true, name: true, email: true, role: true },
		})

		if (!targetUser) {
			return { success: false, error: 'Usuário não encontrado.' }
		}

		if (targetUser.role !== 'enterprise') {
			return { success: false, error: 'Somente usuários enterprise podem ter senha resetada.' }
		}

		const token = generateRandomToken(32)
		const tokenHash = hashToken(token)
		const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS)

		await prisma.passwordResetToken.create({
			data: {
				email: targetUser.email,
				tokenHash,
				expiresAt,
				userId: targetUser.id,
			},
		})

		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
		const resetUrl = `${baseUrl}/reset-password?token=${token}`

		await sendEmail({
			to: targetUser.email,
			subject: 'Redefinição de senha solicitada pelo administrador',
			html: `
				<p>Olá ${targetUser.name || ''},</p>
				<p>O administrador do sistema solicitou a redefinição da sua senha.</p>
				<p>Clique no link abaixo para criar uma nova senha:</p>
				<p><a href="${resetUrl}">${resetUrl}</a></p>
				<p>O link expira em 15 minutos.</p>
				<p>Se você não reconhece esta ação, entre em contato com o suporte.</p>
			`,
		})

		await logSecurityEvent({
			userId: session.id,
			email: targetUser.email,
			action: 'ADMIN_PASSWORD_RESET',
			metadata: {
				targetUserId: targetUser.id,
				targetUserEmail: targetUser.email,
				performedBy: session.email,
			},
		})

		return {
			success: true,
			message: `Link de redefinição enviado para ${targetUser.email}.`,
		}
	} catch (error) {
		console.error('Erro ao resetar senha:', error)
		return { success: false, error: 'Erro interno ao resetar senha.' }
	}
}
