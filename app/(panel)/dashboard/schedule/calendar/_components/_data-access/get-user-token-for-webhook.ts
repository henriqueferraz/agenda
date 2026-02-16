/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca o token_called do usuário por ID para uso em webhooks (ex.: payload de notificação de agendamento).
 *
 * @example
 * const token = await getUserTokenForWebhook('usr_123');
 */
'use server'
import prisma from '@/lib/prisma'
/**
 * Busca o token_called do usuário para incluir em payloads de webhook.
 *
 * @param userId - ID do usuário
 * @returns Token único (token_called) ou null
 * @example
 * const token = await getUserTokenForWebhook('usr_123');
 */
export const getUserTokenForWebhook = async (
	userId: string,
): Promise<string | null> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { token_called: true },
		})
		return user?.token_called || null
	} catch (error) {
		console.error('Erro ao buscar token para webhook:', error)
		return null
	}
}
