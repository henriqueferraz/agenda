/**
 * Server Action - Create Reminder
 *
 * Visao geral:
 * - Action server-side para Create Reminder.
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
 * import * as modulo from "@/app/(panel)/dashboard/dashboard/_actions/create-reminder";
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
 * Esquema de validação para criação de lembrete
 */
const createReminderSchema = z.object({
	description: z
		.string()
		.min(1, 'A descrição é obrigatória')
		.max(500, 'A descrição deve ter no máximo 500 caracteres'),
	userId: z.string().min(1, 'O ID do usuário é obrigatório'),
})
export interface CreateReminderResponse {
	success: boolean
	message: string
	data?: {
		id: string
		description: string
		createdAt: Date
	}
}
/**
 *  Server Action - Criar Lembrete
 *
 * Cria um novo lembrete (tarefa) para o usuário. Valida os dados de entrada
 * usando Zod e utiliza Prisma ORM para inserção segura no banco de dados.
 *
 * ## Funcionalidades
 * -  Validação de dados com Zod
 * -  Criação de lembrete no banco de dados
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe
 *
 * ## Validações
 * - **description**: Obrigatória, mínimo 1 caractere, máximo 500 caracteres
 * - **userId**: Obrigatório, mínimo 1 caractere
 *
 * ## Fluxo de Execução
 * ```
 * 1. Validação dos dados de entrada (Zod)
 * 2. Verificação de parâmetros obrigatórios
 * 3. Inserção no banco de dados (Prisma)
 * 4. Retorno do resultado
 * ```
 *
 * ## Tratamento de Erros
 * - **Validação falha**: Retorna erro de validação
 * - **Erro no banco**: Retorna erro genérico
 * - **Logging**: Todos os erros são logados no console
 *
 * @param data - Dados do lembrete a ser criado
 * @returns Resposta com sucesso/erro e dados do lembrete criado
 *
 * @example
 * ```typescript
 * const result = await createReminder({
 *   description: "Ligar para cliente João",
 *   userId: "usr_123"
 * });
 *
 * if (result.success) {
 *   console.log("Lembrete criado:", result.data?.id);
 * } else {
 *   console.error("Erro:", result.message);
 * }
 * ```
 */
export const createReminder = async (data: {
	description: string
	userId: string
}): Promise<CreateReminderResponse> => {
	try {
		// Validação dos dados
		const validatedData = createReminderSchema.parse(data)
		// Cria o lembrete no banco de dados
		const reminder = await prisma.reminder.create({
			data: {
				description: validatedData.description,
				UserId: validatedData.userId,
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
			message: 'Erro ao criar lembrete. Tente novamente.',
		}
	}
}
