/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que deleta um lembrete do usuario autenticado.
 * Obtem o userId da sessao (cookie JWT), valida id com Zod,
 * verifica propriedade e remove o registro do modelo Reminder.
 *
 * @example
 * import { deleteReminder } from '@/app/(panel)/dashboard/dashboard/_actions/delete-reminder'
 * const result = await deleteReminder({ id: 'rem_123' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

/** Esquema de validacao para exclusao de lembrete */
const deleteReminderSchema = z.object({
	id: z.string().min(1, 'O ID do lembrete é obrigatório'),
})

/** Resposta padrao da action de exclusao de lembrete */
export interface DeleteReminderResponse {
	/** Indica se a operacao foi bem-sucedida */
	success: boolean
	/** Mensagem descritiva do resultado */
	message: string
}

/**
 * Deleta um lembrete existente do usuario autenticado.
 * Obtem o userId diretamente da sessao JWT e verifica propriedade antes de deletar.
 *
 * @param data - Dados do lembrete a ser deletado
 * @param data.id - ID do lembrete a deletar
 * @returns Resposta com sucesso/erro
 *
 * @example
 * ```typescript
 * const result = await deleteReminder({ id: 'rem_123' })
 * if (result.success) {
 *   console.log('Lembrete deletado com sucesso')
 * }
 * ```
 */
export const deleteReminder = async (data: {
	id: string
}): Promise<DeleteReminderResponse> => {
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
		const validatedData = deleteReminderSchema.parse(data)
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
					'Lembrete não encontrado ou você não tem permissão para deletá-lo',
			}
		}
		// Deleta o lembrete no banco de dados
		await prisma.reminder.delete({
			where: {
				id: validatedData.id,
			},
		})
		return {
			success: true,
			message: 'Lembrete deletado com sucesso',
		}
	} catch (error) {
		console.error('Erro ao deletar lembrete:', {
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
			message: 'Erro ao deletar lembrete. Tente novamente.',
		}
	}
}
