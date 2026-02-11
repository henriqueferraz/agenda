/**
 * Server action que atualiza um lembrete existente. Valida id, description e userId com Zod,
 * verifica se o lembrete pertence ao usuário e persiste a alteração no Reminder.
 *
 * @example
 * import { updateReminder } from "@/app/(panel)/dashboard/dashboard/_actions/update-reminder";
 * const result = await updateReminder({ id: "rem_123", description: "Nova descrição", userId: "usr_123" });
 */
'use server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
/**
 * Esquema de validação para atualização de lembrete
 */
const updateReminderSchema = z.object({
	id: z.string().min(1, 'O ID do lembrete é obrigatório'),
	description: z
		.string()
		.min(1, 'A descrição é obrigatória')
		.max(500, 'A descrição deve ter no máximo 500 caracteres'),
	userId: z.string().min(1, 'O ID do usuário é obrigatório'),
})
export interface UpdateReminderResponse {
	success: boolean
	message: string
	data?: {
		id: string
		description: string
		updatedAt: Date
	}
}
/**
 *  Server Action - Atualizar Lembrete
 *
 * Atualiza um lembrete existente. Valida os dados de entrada usando Zod
 * e verifica se o lembrete pertence ao usuário antes de atualizar.
 *
 * ## Funcionalidades
 * -  Validação de dados com Zod
 * -  Verificação de propriedade do lembrete
 * -  Atualização de lembrete no banco de dados
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe
 *
 * ## Validações
 * - **id**: Obrigatório, mínimo 1 caractere
 * - **description**: Obrigatória, mínimo 1 caractere, máximo 500 caracteres
 * - **userId**: Obrigatório, mínimo 1 caractere
 *
 * ## Segurança
 * - Verifica se o lembrete pertence ao usuário antes de atualizar
 * - Previne atualização de lembretes de outros usuários
 *
 * ## Fluxo de Execução
 * ```
 * 1. Validação dos dados de entrada (Zod)
 * 2. Verificação de propriedade do lembrete
 * 3. Atualização no banco de dados (Prisma)
 * 4. Retorno do resultado
 * ```
 *
 * ## Tratamento de Erros
 * - **Validação falha**: Retorna erro de validação
 * - **Lembrete não encontrado**: Retorna erro específico
 * - **Lembrete não pertence ao usuário**: Retorna erro de permissão
 * - **Erro no banco**: Retorna erro genérico
 * - **Logging**: Todos os erros são logados no console
 *
 * @param data - Dados do lembrete a ser atualizado
 * @returns Resposta com sucesso/erro e dados do lembrete atualizado
 *
 * @example
 * ```typescript
 * const result = await updateReminder({
 *   id: "rem_123",
 *   description: "Ligar para cliente João - atualizado",
 *   userId: "usr_123"
 * });
 *
 * if (result.success) {
 *   console.log("Lembrete atualizado:", result.data?.id);
 * } else {
 *   console.error("Erro:", result.message);
 * }
 * ```
 */
export const updateReminder = async (data: {
	id: string
	description: string
	userId: string
}): Promise<UpdateReminderResponse> => {
	try {
		// Validação dos dados
		const validatedData = updateReminderSchema.parse(data)
		// Verifica se o lembrete existe e pertence ao usuário
		const existingReminder = await prisma.reminder.findFirst({
			where: {
				id: validatedData.id,
				UserId: validatedData.userId,
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
			data,
			error: error instanceof Error ? error.message : error,
		})
		// Se for erro de validação do Zod
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
