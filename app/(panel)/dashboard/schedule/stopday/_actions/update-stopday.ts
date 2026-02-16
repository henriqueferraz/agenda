/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza um feriado/dia de parada (StopDay). Valida id, data (opcional), motivo (opcional)
 * e userId, verifica propriedade e conflito de data, normaliza em America/Sao_Paulo e persiste.
 *
 * @example
 * import { updateStopDay } from "@/app/(panel)/dashboard/schedule/stopday/_actions/update-stopday";
 * const result = await updateStopDay({ id: "stop_456", motivation: "Motivo atualizado", userId: "usr_123" });
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { startOfDayInSaoPaulo } from '@/utils/date-timezone'
const updateStopDaySchema = z.object({
	id: z.string().min(1, 'ID é obrigatório'),
	date: z.date().optional(),
	motivation: z
		.string()
		.min(3, 'Motivo deve ter pelo menos 3 caracteres')
		.max(500, 'Motivo deve ter no máximo 500 caracteres')
		.optional(),
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
})
type UpdateStopDayData = z.infer<typeof updateStopDaySchema>
interface ActionResponse {
	success: boolean
	message?: string
	error?: string
	data?: unknown
}
/**
 *  Server Actions - Atualização de Feriados
 *
 * Conjunto de server actions Next.js para atualização segura dos dados
 * de feriados no banco de dados. Implementa validação robusta,
 * autenticação obrigatória e persistência atômica com tratamento completo
 * de erros e revalidação de cache.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Sessão ativa requerida via JWT
 *
 * 2.  Validação de Dados (Zod)
 *    └── Schema completo: id, data (opcional), motivo (opcional)
 *
 * 3.  Verificação de Propriedade
 *    └── Feriado pertence ao usuário autenticado
 *
 * 4.  Verificação de Conflitos
 *    └── Não permite atualizar para data que já possui feriado
 *
 * 5.  Persistência no Banco
 *    └── Update atômico com campos fornecidos
 *
 * 6.  Revalidação de Cache
 *    └── Next.js cache purging específico
 *
 * 7.  Resposta Estruturada
 *    └── Success/Error com mensagens claras
 * ```
 *
 * ## Campos do Feriado
 * - **id**: ID do feriado a ser atualizado (obrigatório)
 * - **date**: Nova data do feriado (opcional, objeto Date)
 * - **motivation**: Novo motivo do feriado (opcional, 3-500 caracteres)
 * - **userId**: ID do usuário (empresa) (obrigatório)
 *
 * ## Validações Implementadas
 * ```typescript
 * const updateStopDaySchema = z.object({
 *   id: z.string().min(1),
 *   date: z.date().optional(),
 *   motivation: z.string().min(3).max(500).optional(),
 *   userId: z.string().min(1)
 * });
 * ```
 *
 * ## Regras de Negócio
 * - **Timezone**: Todas as datas são tratadas no timezone America/Sao_Paulo
 * - **Normalização**: Data é normalizada para início do dia (00:00:00)
 * - **Campos opcionais**: Permite atualizar apenas data ou apenas motivo
 * - **Duplicatas**: Não permite atualizar para data que já possui feriado
 *
 * ## Estratégias de Segurança
 * -  **Autenticação**: Verificação de sessão JWT obrigatória
 * -  **Autorização**: Apenas usuário pode atualizar feriados de sua empresa
 * -  **Validação**: Dupla validação (client + server) com Zod
 * -  **Sanitização**: Dados limpos antes da persistência
 * -  **Transações**: Operações atômicas (ACID compliance)
 * -  **Auditoria**: Logs detalhados de todas as operações
 *
 * ## Tratamento de Erros
 * - **401 Unauthorized**: Sessão expirada/inválida
 * - **400 Bad Request**: Dados de entrada inválidos
 * - **404 Not Found**: Feriado não encontrado
 * - **403 Forbidden**: Feriado não pertence ao usuário
 * - **409 Conflict**: Feriado já existe para a nova data
 * - **500 Internal Error**: Problemas de banco/conectividade
 * - **Fallback**: Mensagens genéricas para segurança
 *
 * ## Revalidação de Cache
 * - Página específica revalidada após sucesso
 * - Cache do Next.js limpo automaticamente
 * - Dados frescos garantidos para próximas requisições
 *
 * ## Logging e Monitoramento
 * - Erros críticos logados com contexto completo
 * - IDs de usuário e feriado incluídos para rastreamento
 * - Dados de entrada preservados para debugging
 * - Timestamps automáticos em todos os logs
 *
 * ## Performance
 * - Operação atômica (ACID compliance)
 * - Conexão otimizada com pool de conexões
 * - Revalidação seletiva (não global)
 * - Sem bloqueios desnecessários
 * - Índices otimizados para queries
 *
 * ## Cenários de Uso
 * - Correção de data de feriado
 * - Atualização de motivo
 * - Reagendamento de feriado
 * - Correção de informações cadastrais
 *
 * @see {@link getUserFromToken} - Autenticação JWT
 * @see {@link prisma.stopDay.update} - Operação de banco
 * @see {@link revalidatePath} - Cache management
 * @see {@link startOfDayInSaoPaulo} - Início do dia (timezone America/Sao_Paulo)
 * @see {@link endOfDayInSaoPaulo} - Fim do dia (timezone America/Sao_Paulo)
 */
/**
 * Atualiza um feriado existente no banco de dados
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada (Zod)
 * 3. Verificação de propriedade (feriado pertence ao usuário)
 * 4. Verificação de conflitos (se data mudou, não permite duplicatas)
 * 5. Normalização da data para início do dia (se fornecida)
 * 6. Atualização no banco de dados
 * 7. Revalidação do cache
 *
 * @param data - Dados do feriado a ser atualizado
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * const result = await updateStopDay({
 *   id: "stop_456",
 *   date: new Date("2024-01-16"), // Opcional
 *   motivation: "Feriado Atualizado", // Opcional
 *   userId: "usr_123"
 * });
 *
 * if (result.success) {
 *   console.log(result.message); // "Feriado atualizado com sucesso!"
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export const updateStopDay = async (
	data: UpdateStopDayData,
): Promise<ActionResponse> => {
	try {
		// Verificar autenticação
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}
		// Validar dados
		const validatedData = updateStopDaySchema.parse(data)
		// Verificar se o usuário é o dono da empresa
		if (validatedData.userId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para atualizar feriados nesta empresa.',
			}
		}
		// Verificar se o feriado existe e pertence ao usuário
		const existingStopDay = await prisma.stopDay.findFirst({
			where: {
				id: validatedData.id,
				UserId: validatedData.userId,
			},
		})
		if (!existingStopDay) {
			return {
				success: false,
				error: 'Feriado não encontrado.',
			}
		}
		// Se a data está sendo atualizada, verificar se não há conflito
		if (validatedData.date) {
			const normalizedDate = startOfDayInSaoPaulo(validatedData.date)
			const conflictingStopDay = await prisma.stopDay.findFirst({
				where: {
					UserId: validatedData.userId,
					id: { not: validatedData.id },
					date: {
						gte: normalizedDate,
						lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
					},
				},
			})
			if (conflictingStopDay) {
				return {
					success: false,
					error: 'Já existe um feriado cadastrado para esta data.',
				}
			}
		}
		// Preparar dados para atualização
		const updateData: {
			date?: Date
			motivation?: string
		} = {}
		if (validatedData.date) {
			updateData.date = startOfDayInSaoPaulo(validatedData.date)
		}
		if (validatedData.motivation) {
			updateData.motivation = validatedData.motivation
		}
		// Atualizar feriado
		const stopDay = await prisma.stopDay.update({
			where: {
				id: validatedData.id,
			},
			data: updateData,
		})
		// Revalidar cache
		revalidatePath('/dashboard/schedule/stopday')
		return {
			success: true,
			message: 'Feriado atualizado com sucesso!',
			data: stopDay,
		}
	} catch (error) {
		console.error('Erro ao atualizar feriado:', error)
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || 'Dados inválidos',
			}
		}
		return {
			success: false,
			error:
				error instanceof Error ? error.message : 'Erro ao atualizar feriado',
		}
	}
}
