/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza um lembrete existente do usuario autenticado.
 * Obtem o userId da sessao (cookie JWT), valida id e description com Zod,
 * verifica propriedade e persiste a alteracao no Reminder.
 *
 * @example
 * import { updateReminder } from '@/app/(panel)/dashboard/dashboard/_actions/update-reminder'
 * const result = await updateReminder({ id: 'rem_123', description: 'Nova descrição' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

/** Esquema de validacao para atualizacao de lembrete */
const updateReminderSchema = z.object({
	id: z.string().min(1, 'O ID do lembrete é obrigatório'),
	description: z
		.string()
		.min(1, 'A descrição é obrigatória')
		.max(500, 'A descrição deve ter no máximo 500 caracteres'),
})

/** Resposta padrao da action de atualizacao de lembrete */
export interface UpdateReminderResponse {
	/** Indica se a operacao foi bem-sucedida */
	success: boolean
	/** Mensagem descritiva do resultado */
	message: string
	/** Dados do lembrete atualizado (presente apenas em caso de sucesso) */
	data?: {
		id: string
		description: string
		updatedAt: Date
	}
}

/**
 * Atualiza um lembrete existente do usuario autenticado.
 * Obtem o userId diretamente da sessao JWT e verifica propriedade antes de atualizar.
 *
 * @param data - Dados do lembrete a ser atualizado
 * @param data.id - ID do lembrete a atualizar
 * @param data.description - Nova descricao do lembrete (1-500 caracteres)
 * @returns Resposta com sucesso/erro e dados do lembrete atualizado
 *
 * @example
 * ```typescript
 * const result = await updateReminder({
 *   id: 'rem_123',
 *   description: 'Ligar para cliente João - atualizado',
 * })
 * if (result.success) {
 *   console.log('Lembrete atualizado:', result.data?.id)
 * }
 * ```
 */
export const updateReminder = async (data: {
	id: string
	description: string
}): Promise<UpdateReminderResponse> => {
	try {
		// Verifica autenticacao via sessao JWT
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				message: 'Usuário não autenticado. Faça login novamente.',
			}
		}
		// Validacao dos dados de entrada
		const validatedData = updateReminderSchema.parse(data)
		// Verifica se o lembrete existe e pertence ao usuario autenticado
		const existingReminder = await prisma.reminder.findFirst({
			where: {
				id: validatedData.id,
				UserId: session.id,
			},
		})
		if (!existingReminder) {
			return {
				success: false,
				message:
					'Lembrete não encontrado ou você não tem permissão para editá-lo',
			}
		}
		// Atualiza o lembrete no banco de dados
		const updatedReminder = await prisma.reminder.update({
			where: {
				id: validatedData.id,
			},
			data: {
				description: validatedData.description,
			},
			select: {
				id: true,
				description: true,
				updatedAt: true,
			},
		})
		return {
			success: true,
			message: 'Lembrete atualizado com sucesso',
			data: updatedReminder,
		}
	} catch (error) {
		console.error('Erro ao atualizar lembrete:', {
			error: error instanceof Error ? error.message : error,
		})
		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: error.issues[0]?.message || 'Erro de validação',
			}
		}
		return {
			success: false,
			message: 'Erro ao atualizar lembrete. Tente novamente.',
		}
	}
}
