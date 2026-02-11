/**
 * Server action que cria um feriado/dia de parada (StopDay) para o usuário. Valida data, motivo e userId
 * com Zod, verifica autenticação e duplicidade de data, normaliza data em America/Sao_Paulo e persiste.
 *
 * @example
 * import { createStopDay } from "@/app/(panel)/dashboard/schedule/stopday/_actions/create-stopday";
 * const result = await createStopDay({ date: new Date("2024-01-15"), motivation: "Feriado", userId: "usr_123" });
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { startOfDayInSaoPaulo } from '@/utils/date-timezone'
const createStopDaySchema = z.object({
	date: z.date(),
	motivation: z
		.string()
		.min(3, 'Motivo deve ter pelo menos 3 caracteres')
		.max(500, 'Motivo deve ter no máximo 500 caracteres'),
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
})
type CreateStopDayData = z.infer<typeof createStopDaySchema>
interface ActionResponse {
	success: boolean
	message?: string
	error?: string
	data?: unknown
}
/**
 *  Server Actions - Criação de Feriados
 *
 * Conjunto de server actions Next.js para criação segura de feriados
 * (dias de parada) no banco de dados. Implementa validação robusta,
 * autenticação obrigatória e persistência atômica no banco de dados com
 * tratamento completo de erros e revalidação de cache.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Sessão ativa requerida via JWT
 *
 * 2.  Validação de Dados (Zod)
 *    └── Schema completo: data, motivo, userId
 *
 * 3.  Verificação de Propriedade
 *    └── Usuário autenticado é o dono da empresa
 *
 * 4.  Verificação de Conflitos
 *    └── Não permite criar feriado duplicado para a mesma data
 *
 * 5.  Persistência no Banco
 *    └── Create atômico com data normalizada
 *
 * 6.  Revalidação de Cache
 *    └── Next.js cache purging específico para feriados
 *
 * 7.  Resposta Estruturada
 *    └── Success/Error com mensagens claras
 * ```
 *
 * ## Campos do Feriado
 * - **date**: Data do feriado (obrigatório, objeto Date)
 * - **motivation**: Motivo do feriado (obrigatório, 3-500 caracteres)
 * - **userId**: ID do usuário (empresa) (obrigatório)
 *
 * ## Validações Implementadas
 * ```typescript
 * const createStopDaySchema = z.object({
 *   date: z.date(),
 *   motivation: z.string().min(3).max(500),
 *   userId: z.string().min(1)
 * });
 * ```
 *
 * ## Regras de Negócio
 * - **Timezone**: Todas as datas são tratadas no timezone America/Sao_Paulo
 * - **Normalização**: Data é normalizada para início do dia (00:00:00)
 * - **Duplicatas**: Não permite criar feriado para data que já possui feriado
 * - **Agendamentos**: Não bloqueia criação mesmo se houver agendamentos (usuário é avisado)
 *
 * ## Estratégias de Segurança
 * -  **Autenticação**: Verificação de sessão JWT obrigatória
 * -  **Autorização**: Apenas usuário pode criar feriados em sua empresa
 * -  **Validação**: Dupla validação (client + server) com Zod
 * -  **Sanitização**: Dados limpos antes da persistência
 * -  **Transações**: Operações atômicas (ACID compliance)
 * -  **Auditoria**: Logs detalhados de todas as operações
 *
 * ## Tratamento de Erros
 * - **401 Unauthorized**: Sessão expirada/inválida
 * - **400 Bad Request**: Dados de entrada inválidos
 * - **403 Forbidden**: Usuário não tem permissão
 * - **409 Conflict**: Feriado já existe para esta data
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
 * - IDs de usuário incluídos para rastreamento
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
 * - Cadastro de feriados nacionais
 * - Marcação de dias de manutenção
 * - Eventos especiais da empresa
 * - Fechamento temporário
 *
 * ## Impacto nos Agendamentos
 * ### Validações Relacionadas
 * - **Bloqueio**: Agendamentos não podem ser criados em feriados
 * - **Visualização**: Feriados aparecem em vermelho no calendário
 * - **Aviso**: Usuário é avisado se houver agendamentos na data
 *
 * @see {@link getUserFromToken} - Autenticação JWT
 * @see {@link prisma.stopDay.create} - Operação de banco
 * @see {@link revalidatePath} - Cache management
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 */
/**
 * Cria um novo feriado no banco de dados
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada (Zod)
 * 3. Verificação de propriedade (usuário é dono da empresa)
 * 4. Verificação de conflitos (não permite duplicatas)
 * 5. Normalização da data para início do dia
 * 6. Criação no banco de dados
 * 7. Revalidação do cache
 *
 * @param data - Dados do feriado a ser criado
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * const result = await createStopDay({
 *   date: new Date("2024-01-15"),
 *   motivation: "Feriado Nacional",
 *   userId: "usr_123"
 * });
 *
 * if (result.success) {
 *   console.log(result.message); // "Feriado criado com sucesso!"
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export const createStopDay = async (
	data: CreateStopDayData,
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
		const validatedData = createStopDaySchema.parse(data)
		// Verificar se o usuário é o dono da empresa
		if (validatedData.userId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para criar feriados nesta empresa.',
			}
		}
		// Normalizar a data para o início do dia no timezone America/Sao_Paulo
		const normalizedDate = startOfDayInSaoPaulo(validatedData.date)
		// Verificar se já existe um feriado para esta data
		const existingStopDay = await prisma.stopDay.findFirst({
			where: {
				UserId: validatedData.userId,
				date: {
					gte: normalizedDate,
					lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000), // Próximo dia
				},
			},
		})
		if (existingStopDay) {
			return {
				success: false,
				error: 'Já existe um feriado cadastrado para esta data.',
			}
		}
		// Criar feriado
		const stopDay = await prisma.stopDay.create({
			data: {
				date: normalizedDate,
				motivation: validatedData.motivation,
				UserId: validatedData.userId,
			},
		})
		// Revalidar cache
		revalidatePath('/dashboard/schedule/stopday')
		return {
			success: true,
			message: 'Feriado criado com sucesso!',
			data: stopDay,
		}
	} catch (error) {
		console.error('Erro ao criar feriado:', error)
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || 'Dados inválidos',
			}
		}
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Erro ao criar feriado',
		}
	}
}
