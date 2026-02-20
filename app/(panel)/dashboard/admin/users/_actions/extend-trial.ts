/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Server action para estender o trial de um usuario enterprise.
 * Somente usuarios com role master podem executar esta acao.
 * Adiciona 30 dias ao trialEndsAt do usuario alvo.
 *
 * @example
 * import { extendTrial } from './_actions/extend-trial'
 * const result = await extendTrial('target_user_id')
 */
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/** Duracao da extensao do trial em milissegundos (30 dias) */
const EXTENSION_MS = 30 * 24 * 60 * 60 * 1000

const extendTrialSchema = z.object({
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
})

/**
 * Estende o trial de um usuario enterprise em 30 dias.
 * Se o trial ja expirou, a extensao parte da data atual.
 * Se o trial ainda esta ativo, adiciona 30 dias ao fim atual.
 *
 * @param userId - ID do usuario enterprise cujo trial sera estendido
 * @returns Objeto com success e message, ou error
 *
 * @example
 * const result = await extendTrial('cmk069h7v0001o1ui1234abcd')
 * if (result.success) console.log(result.message)
 */
export const extendTrial = async (userId: string) => {
	try {
		const session = await getUserFromToken()
		if (!session) {
			return { success: false, error: 'Não autenticado.' }
		}

		if (session.role !== 'master') {
			return { success: false, error: 'Acesso negado. Somente administradores.' }
		}

		const parsed = extendTrialSchema.safeParse({ userId })
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
		}

		const targetUser = await prisma.user.findUnique({
			where: { id: parsed.data.userId },
			select: { id: true, role: true, trialEndsAt: true, name: true },
		})

		if (!targetUser) {
			return { success: false, error: 'Usuário não encontrado.' }
		}

		if (targetUser.role !== 'enterprise') {
			return { success: false, error: 'Somente usuários enterprise podem ter trial estendido.' }
		}

		const now = new Date()
		const currentEnd = targetUser.trialEndsAt ?? now
		const baseDate = currentEnd > now ? currentEnd : now
		const newTrialEndsAt = new Date(baseDate.getTime() + EXTENSION_MS)

		await prisma.user.update({
			where: { id: parsed.data.userId },
			data: { trialEndsAt: newTrialEndsAt },
		})

		revalidatePath('/dashboard/admin/users')

		return {
			success: true,
			message: `Trial de ${targetUser.name || 'usuário'} estendido até ${newTrialEndsAt.toLocaleDateString('pt-BR')}.`,
		}
	} catch (error) {
		console.error('Erro ao estender trial:', error)
		return { success: false, error: 'Erro interno ao estender trial.' }
	}
}
