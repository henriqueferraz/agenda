/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que cria um novo lembrete (tarefa) para o usuario autenticado.
 * Obtem o userId da sessao (cookie JWT), valida description com Zod
 * e insere no modelo Reminder via Prisma. Retorno type-safe com sucesso/erro.
 *
 * @example
 * import { createReminder } from '@/app/(panel)/dashboard/dashboard/_actions/create-reminder'
 * const result = await createReminder({ description: 'Ligar para cliente' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'

/** Esquema de validacao para criacao de lembrete */
const createReminderSchema = z.object({
	description: z
		.string()
		.min(1, 'A descrição é obrigatória')
		.max(500, 'A descrição deve ter no máximo 500 caracteres'),
})

/** Resposta padrao da action de criacao de lembrete */
export interface CreateReminderResponse {
	/** Indica se a operacao foi bem-sucedida */
	success: boolean
	/** Mensagem descritiva do resultado */
	message: string
	/** Dados do lembrete criado (presente apenas em caso de sucesso) */
	data?: {
		id: string
		description: string
		createdAt: Date
	}
}

/**
 * Cria um novo lembrete para o usuario autenticado.
 * Obtem o userId diretamente da sessao JWT para garantir seguranca.
 *
 * @param data - Dados do lembrete contendo apenas a descricao
 * @param data.description - Texto do lembrete (1-500 caracteres)
 * @returns Resposta com sucesso/erro e dados do lembrete criado
 *
 * @example
 * ```typescript
 * const result = await createReminder({ description: 'Ligar para cliente João' })
 * if (result.success) {
 *   console.log('Lembrete criado:', result.data?.id)
 * }
 * ```
 */
export const createReminder = async (data: {
	description: string
}): Promise<CreateReminderResponse> => {
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
		const validatedData = createReminderSchema.parse(data)
		// Cria o lembrete vinculado ao usuario autenticado
		const reminder = await prisma.reminder.create({
			data: {
				description: validatedData.description,
				UserId: session.id,
			},
			select: {
				id: true,
				description: true,
				createdAt: true,
			},
		})
		return {
			success: true,
			message: 'Lembrete criado com sucesso',
			data: reminder,
		}
	} catch (error) {
		console.error('Erro ao criar lembrete:', {
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
			message: 'Erro ao criar lembrete. Tente novamente.',
		}
	}
}
