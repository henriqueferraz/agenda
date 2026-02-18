/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca a configuração de mensagens (MessageConfig) do usuário.
 * Se não existir registro, retorna os valores default (todos os lembretes ativos, canal WhatsApp).
 * Valida autenticação via JWT.
 *
 * @example
 * const config = await getMessageConfig({ userId: 'usr_1' })
 * if (config.reminder24h) console.log('Lembrete 24h ativo')
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/** Formato retornado pela data-access, sempre com todos os campos preenchidos. */
export interface MessageConfigData {
	/** ID do registro (vazio se usando defaults). */
	id: string
	/** Lembrete 7 dias antes ativo. */
	reminder7d: boolean
	/** Lembrete 24 horas antes ativo. */
	reminder24h: boolean
	/** Lembrete 2 horas antes ativo. */
	reminder2h: boolean
	/** Canal de envio: 'whatsapp', 'email' ou 'both'. */
	reminderChannel: string
}

/** Valores default quando o usuário não configurou nada. */
const DEFAULT_CONFIG: MessageConfigData = {
	id: '',
	reminder7d: true,
	reminder24h: true,
	reminder2h: true,
	reminderChannel: 'whatsapp',
}

/**
 * Busca a configuração de mensagens do usuário autenticado.
 * Retorna os defaults se o registro não existir.
 *
 * @param params - userId do usuário (empresa)
 * @returns MessageConfigData com as configurações ou defaults
 *
 * @example
 * ```typescript
 * const config = await getMessageConfig({ userId: 'usr_1' })
 * console.log(config.reminder7d)      // true
 * console.log(config.reminderChannel) // 'whatsapp'
 * ```
 */
export const getMessageConfig = async ({
	userId,
}: {
	userId: string
}): Promise<MessageConfigData> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) {
			return DEFAULT_CONFIG
		}

		const config = await prisma.messageConfig.findUnique({
			where: { userId },
		})

		if (!config) {
			return DEFAULT_CONFIG
		}

		return {
			id: config.id,
			reminder7d: config.reminder7d,
			reminder24h: config.reminder24h,
			reminder2h: config.reminder2h,
			reminderChannel: config.reminderChannel,
		}
	} catch (error) {
		console.error('Erro ao buscar MessageConfig:', {
			error: error instanceof Error ? error.message : error,
		})
		return DEFAULT_CONFIG
	}
}
