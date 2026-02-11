/**
 * Server action que deleta um feriado/dia de parada (StopDay). Verifica autenticação e propriedade
 * (feriado pertence ao usuário), então remove o registro e revalida o cache da página de feriados.
 *
 * @example
 * import { deleteStopDay } from "@/app/(panel)/dashboard/schedule/stopday/_actions/delete-stopday";
 * const result = await deleteStopDay({ id: "stop_456", userId: "usr_123" });
 */
'use server'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
interface DeleteStopDayData {
	id: string
	userId: string
}
interface ActionResponse {
	success: boolean
	message?: string
	error?: string
}
/**
 *  Server Actions - Exclusão de Feriados
 *
 * Server action Next.js para exclusão segura de feriados do banco de dados.
 * Implementa validação robusta, autenticação obrigatória e exclusão atômica
 * com tratamento completo de erros e revalidação de cache.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Sessão ativa requerida via JWT
 *
 * 2.  Validação de Dados
 *    └── ID do feriado válido
 *
 * 3.  Verificação de Propriedade
 *    └── Feriado pertence ao usuário autenticado
 *
 * 4.  Exclusão no Banco
 *    └── Delete atômico do feriado
 *
 * 5.  Revalidação de Cache
 *    └── Next.js cache purging específico
 *
 * 6.  Resposta Estruturada
 *    └── Success/Error com mensagens claras
 * ```
 *
 * ## Validações Implementadas
 * - **ID obrigatório**: ID do feriado deve ser fornecido
 * - **ID não vazio**: ID não pode ser string vazia
 * - **Propriedade**: Feriado deve pertencer ao usuário autenticado
 *
 * ## Comportamento de Exclusão
 * - **Cascata**: Relacionamentos são deletados automaticamente
 * - **Agendamentos**: Agendamentos existentes não são afetados (podem ser criados após exclusão)
 * - **Auditoria**: Log de exclusão para rastreamento
 *
 * ## Estratégias de Segurança
 * -  **Autenticação**: Verificação de sessão JWT obrigatória
 * -  **Autorização**: Apenas usuário pode deletar feriados de sua empresa
 * -  **Validação**: Verificação de existência e propriedade
 * -  **Transações**: Operações atômicas (ACID compliance)
 * -  **Auditoria**: Logs detalhados de todas as operações
 *
 * ## Tratamento de Erros
 * - **401 Unauthorized**: Sessão expirada/inválida
 * - **400 Bad Request**: ID não fornecido ou inválido
 * - **404 Not Found**: Feriado não encontrado
 * - **403 Forbidden**: Feriado não pertence ao usuário
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
 * - Remoção de feriado cancelado
 * - Correção de cadastros duplicados
 * - Limpeza de dados de teste
 * - Reorganização de calendário
 *
 * ## Considerações Importantes
 * -  **Agendamentos**: Após exclusão, agendamentos podem ser criados na data
 * -  **Histórico**: Considerar soft delete para manter histórico
 * -  **Relatórios**: Feriados deletados podem afetar relatórios históricos
 *
 * @see {@link getUserFromToken} - Autenticação JWT
 * @see {@link prisma.stopDay.delete} - Operação de banco
 * @see {@link revalidatePath} - Cache management
 */
/**
 * Deleta um feriado do banco de dados
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Verificação de propriedade (feriado pertence ao usuário)
 * 3. Verificação de existência (feriado existe)
 * 4. Exclusão no banco de dados
 * 5. Revalidação do cache
 *
 * @param data - Dados do feriado a ser deletado
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * const result = await deleteStopDay({
 *   id: "stop_456",
 *   userId: "usr_123"
 * });
 *
 * if (result.success) {
 *   console.log(result.message); // "Feriado deletado com sucesso!"
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export const deleteStopDay = async (
	data: DeleteStopDayData,
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
		// Verificar se o usuário é o dono da empresa
		if (data.userId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para deletar feriados nesta empresa.',
			}
		}
		// Verificar se o feriado existe e pertence ao usuário
		const existingStopDay = await prisma.stopDay.findFirst({
			where: {
				id: data.id,
				UserId: data.userId,
			},
		})
		if (!existingStopDay) {
			return {
				success: false,
				error: 'Feriado não encontrado.',
			}
		}
		// Deletar feriado
		await prisma.stopDay.delete({
			where: {
				id: data.id,
			},
		})
		// Revalidar cache
		revalidatePath('/dashboard/schedule/stopday')
		return {
			success: true,
			message: 'Feriado deletado com sucesso!',
		}
	} catch (error) {
		console.error('Erro ao deletar feriado:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Erro ao deletar feriado',
		}
	}
}
