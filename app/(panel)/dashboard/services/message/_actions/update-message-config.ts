/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Server action para atualizar a configuração de mensagens (MessageConfig).
 * Faz upsert (cria se não existir, atualiza se existir). Valida autenticação
 * e dados com Zod. Usado pela página services/message (F-03).
 *
 * @example
 * import { updateMessageConfig } from './_actions/update-message-config'
 * const result = await updateMessageConfig({ reminder7d: true, reminder24h: true, reminder2h: false, reminderChannel: 'whatsapp' })
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/** Schema de validação para configuração de mensagens. */
const messageConfigSchema = z.object({
	reminder7d: z.boolean(),
	reminder24h: z.boolean(),
	reminder2h: z.boolean(),
	reminderChannel: z.enum(['whatsapp', 'email', 'both']),
})

/** Dados de entrada para atualização. */
export type UpdateMessageConfigData = z.infer<typeof messageConfigSchema>

/** Resposta padronizada da server action. */
interface ActionResponse {
	/** Indica se a operação foi bem-sucedida. */
	success: boolean
	/** Mensagem de erro. */
	error?: string
	/** Mensagem de sucesso. */
	message?: string
}

/**
 * Atualiza (ou cria) a configuração de mensagens do usuário autenticado.
 * Usa upsert para garantir idempotência.
 *
 * @param data - Configurações de lembretes e canal
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await updateMessageConfig({
 *   reminder7d: true,
 *   reminder24h: true,
 *   reminder2h: false,
 *   reminderChannel: 'both',
 * })
 * if (result.success) console.log(result.message)
 * ```
 */
export const updateMessageConfig = async (
	data: UpdateMessageConfigData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return { success: false, error: 'Não autenticado. Faça login para continuar.' }
		}

		const validated = messageConfigSchema.parse(data)

		await prisma.messageConfig.upsert({
			where: { userId: session.id },
			update: {
				reminder7d: validated.reminder7d,
				reminder24h: validated.reminder24h,
				reminder2h: validated.reminder2h,
				reminderChannel: validated.reminderChannel,
			},
			create: {
				userId: session.id,
				reminder7d: validated.reminder7d,
				reminder24h: validated.reminder24h,
				reminder2h: validated.reminder2h,
				reminderChannel: validated.reminderChannel,
			},
		})

		revalidatePath('/dashboard/services/message')

		return { success: true, message: 'Configurações salvas com sucesso!' }
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0]?.message ?? 'Dados inválidos' }
		}
		console.error('Erro ao atualizar MessageConfig:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return { success: false, error: 'Erro ao salvar configurações. Tente novamente.' }
	}
}
