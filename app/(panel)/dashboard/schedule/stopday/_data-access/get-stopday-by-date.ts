/**
 * Data Access: busca o feriado (stopday) cadastrado para uma data específica; a data é normalizada para início do dia em America/Sao_Paulo.
 *
 * @example
 * const stopDay = await getStopDayByDate({ userId: 'usr_123', date: new Date() });
 */
'use server'
import prisma from '@/lib/prisma'
import { startOfDayInSaoPaulo } from '@/utils/date-timezone'
interface GetStopDayByDateProps {
	/** ID único do usuário (empresa) */
	userId: string
	/** Data para verificar */
	date: Date
}
export interface StopDay {
	id: string
	date: Date
	motivation: string
	createdAt: Date
	updatedAt: Date
}
/**
 *  Data Access Layer - Feriado por Data
 *
 * Camada de acesso a dados responsável por buscar um feriado para uma
 * data específica. Utiliza Prisma ORM para consultas seguras e tipadas
 * ao banco de dados PostgreSQL. Todas as datas são tratadas no timezone
 * America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de feriado por usuário e data
 * -  Normalização de data para início do dia
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Prisma
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type StopDay = {
 *   id: string;
 *   date: Date;
 *   motivation: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * } | null;
 * ```
 *
 * ## Tratamento de Timezone
 * - **Normalização**: Data é normalizada para início do dia (00:00:00) no timezone America/Sao_Paulo
 * - **Busca**: Busca feriado entre início e fim do dia (24 horas)
 * - **Comparações**: Todas as comparações usam timezone America/Sao_Paulo
 *
 * ## Cenários de Uso
 * - Verificação se uma data é feriado
 * - Validação antes de criar agendamento
 * - Exibição de motivo em modais
 * - Bloqueio de agendamentos em feriados
 *
 * ## Estratégias de Cache
 * - Feriado por data cacheável por sessão
 * - Revalidação necessária após criação/atualização
 * - Considerar cache em memória para alta frequência
 *
 * ## Segurança
 * - Validação de entrada obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios feriados
 *
 * ## Performance
 * - Consulta otimizada com findFirst
 * - Índices recomendados na tabela StopDay(UserId, date)
 * - Retorno apenas do primeiro feriado encontrado
 *
 * @see {@link prisma.stopDay.findFirst} - Método Prisma utilizado
 * @see {@link GetStopDayByDateProps} - Interface de parâmetros
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 */
/**
 * Busca um feriado para uma data específica
 *
 * Esta função é executada no servidor e busca o feriado cadastrado para uma
 * data específica. A data é normalizada para o início do dia no timezone
 * America/Sao_Paulo antes da busca.
 *
 * @param props - Propriedades da consulta
 * @returns Feriado encontrado ou null se não houver
 *
 * @example
 * ```typescript
 * const stopDay = await getStopDayByDate({
 *   userId: "usr_123",
 *   date: new Date("2024-01-15")
 * });
 * if (stopDay) {
 *   console.log(stopDay.motivation); // "Feriado Nacional"
 * }
 * ```
 */
export const getStopDayByDate = async ({
	userId,
	date,
}: GetStopDayByDateProps): Promise<StopDay | null> => {
	try {
		if (!userId || !date) {
			return null
		}
		// Normalizar a data para o início do dia no timezone America/Sao_Paulo
		const normalizedDate = startOfDayInSaoPaulo(date)
		const nextDay = new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
		const stopDay = await prisma.stopDay.findFirst({
			where: {
				UserId: userId,
				date: {
					gte: normalizedDate,
					lt: nextDay,
				},
			},
		})
		return stopDay
	} catch (error) {
		console.error('Erro ao buscar feriado por data:', {
			userId,
			date,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
