/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Server action para deletar um bloqueio de horário de funcionário. Verifica autenticação,
 * propriedade (bloqueio pertence ao usuário), e remove o registro do banco.
 *
 * @example
 * import { deleteBlockedTime } from "@/app/(panel)/dashboard/schedule/blocked-time/_actions/delete-blocked-time"
 * const result = await deleteBlockedTime({ id: "block_456", userId: "usr_123" })
 */
'use server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/** Dados necessários para deletar um bloqueio */
interface DeleteBlockedTimeData {
	/** ID do bloqueio a ser deletado */
	id: string
	/** ID do usuário (empresa) dono do bloqueio */
	userId: string
}

/** Resposta padronizada da server action */
interface ActionResponse {
	/** Indica se a operação foi bem-sucedida */
	success: boolean
	/** Mensagem de sucesso */
	message?: string
	/** Mensagem de erro */
	error?: string
}

/**
 * Deleta um bloqueio de horário do banco de dados. Verifica autenticação e propriedade
 * antes de remover.
 *
 * @param data - Dados do bloqueio a ser deletado (id + userId)
 * @returns ActionResponse com resultado da operação
 *
 * @example
 * ```typescript
 * const result = await deleteBlockedTime({ id: "block_456", userId: "usr_123" })
 * if (result.success) {
 *   console.log(result.message) // "Bloqueio removido com sucesso!"
 * }
 * ```
 */
export const deleteBlockedTime = async (
	data: DeleteBlockedTimeData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}

		if (data.userId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para deletar bloqueios nesta empresa.',
			}
		}

		const existingBlock = await prisma.blockedTime.findFirst({
			where: {
				id: data.id,
				UserId: data.userId,
			},
		})
		if (!existingBlock) {
			return {
				success: false,
				error: 'Bloqueio não encontrado.',
			}
		}

		await prisma.blockedTime.delete({
			where: { id: data.id },
		})

		revalidatePath('/dashboard/schedule/blocked-time')

		return {
			success: true,
			message: 'Bloqueio removido com sucesso!',
		}
	} catch (error) {
		console.error('Erro ao deletar bloqueio de horário:', {
			blockedTimeId: data.id,
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Erro ao deletar bloqueio',
		}
	}
}
