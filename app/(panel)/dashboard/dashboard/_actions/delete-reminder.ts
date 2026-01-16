/**
 * Server Action - Delete Reminder
 *
 * Visao geral:
 * - Action server-side para Delete Reminder.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar entrada e contexto do usuario.
 * - Executar a regra de negocio principal.
 * - Retornar respostas consistentes.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/dashboard/_actions/delete-reminder";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
/**
 * Esquema de validação para exclusão de lembrete
 */
const deleteReminderSchema = z.object({
	id: z.string().min(1, 'O ID do lembrete é obrigatório'),
	userId: z.string().min(1, 'O ID do usuário é obrigatório'),
})
export interface DeleteReminderResponse {
	success: boolean
	message: string
}
/**
 *  Server Action - Deletar Lembrete
 *
 * Deleta um lembrete existente. Valida os dados de entrada usando Zod
 * e verifica se o lembrete pertence ao usuário antes de deletar.
 *
 * ## Funcionalidades
 * -  Validação de dados com Zod
 * -  Verificação de propriedade do lembrete
 * -  Exclusão de lembrete no banco de dados
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe
 *
 * ## Validações
 * - **id**: Obrigatório, mínimo 1 caractere
 * - **userId**: Obrigatório, mínimo 1 caractere
 *
 * ## Segurança
 * - Verifica se o lembrete pertence ao usuário antes de deletar
 * - Previne exclusão de lembretes de outros usuários
 *
 * ## Fluxo de Execução
 * ```
 * 1. Validação dos dados de entrada (Zod)
 * 2. Verificação de propriedade do lembrete
 * 3. Exclusão no banco de dados (Prisma)
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
 * @param data - Dados do lembrete a ser deletado
 * @returns Resposta com sucesso/erro
 *
 * @example
 * ```typescript
 * const result = await deleteReminder({
 *   id: "rem_123",
 *   userId: "usr_123"
 * });
 *
 * if (result.success) {
 *   console.log("Lembrete deletado com sucesso");
 * } else {
 *   console.error("Erro:", result.message);
 * }
 * ```
 */
export const deleteReminder = async (data: {
	id: string
	userId: string
}): Promise<DeleteReminderResponse> => {
	try {
		// Validação dos dados
		const validatedData = deleteReminderSchema.parse(data)
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
			message: 'Erro ao deletar lembrete. Tente novamente.',
		}
	}
}
