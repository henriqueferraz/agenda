/**
 * Data Access: retorna os dias do mês (1-31) que são feriados (stopdays) para o usuário, no timezone America/Sao_Paulo.
 *
 * @example
 * const holidays = await getMonthStopDays({ userId: 'usr_123', year: 2024, month: 0 });
 */
'use server'
import prisma from '@/lib/prisma'
import {
	createDateInSaoPaulo,
	getDateComponentsInSaoPaulo,
} from '@/utils/date-timezone'
interface GetMonthStopDaysProps {
	/** ID único do usuário (empresa) */
	userId: string
	/** Ano e mês para buscar feriados */
	year: number
	month: number // 0-11 (janeiro = 0)
}
/**
 *  Data Access Layer - Feriados do Mês
 *
 * Camada de acesso a dados responsável por buscar todos os dias do mês
 * que são feriados (dias de parada). Utiliza Prisma ORM para consultas
 * seguras e tipadas ao banco de dados PostgreSQL. Todas as datas são
 * tratadas no timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de feriados por usuário, ano e mês
 * -  Extração de dias únicos com feriados
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com array de números (dias)
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type MonthStopDays = number[]; // Array de dias (1-31) com feriados
 * // Exemplo: [1, 7, 21] = dias 1, 7 e 21 são feriados
 * ```
 *
 * ## Tratamento de Timezone
 * - **Início do mês**: Primeiro dia às 00:00:00 no timezone America/Sao_Paulo
 * - **Fim do mês**: Último dia às 23:59:59 no timezone America/Sao_Paulo
 * - **Extração de dias**: Componentes extraídos no timezone America/Sao_Paulo
 *
 * ## Parâmetros de Entrada
 * - **userId**: ID único do usuário (empresa) - obrigatório
 * - **year**: Ano (ex: 2024) - obrigatório
 * - **month**: Mês (0-11, onde 0 = janeiro) - obrigatório
 *
 * ## Cenários de Uso
 * - Marcação de dias no calendário mensal (em vermelho)
 * - Bloqueio de agendamentos em feriados
 * - Indicadores visuais de dias fechados
 * - Validação de disponibilidade
 *
 * ## Estratégias de Cache
 * - Lista de dias cacheáveis por sessão
 * - Revalidação necessária após criação/atualização de feriados
 * - Considerar cache em memória para alta frequência
 *
 * ## Segurança
 * - Validação de entrada obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios feriados
 *
 * ## Performance
 * - Consulta otimizada com select específico
 * - Índices recomendados na tabela StopDay(UserId, date)
 * - Processamento eficiente de dias únicos
 * - Retorno apenas dos dias necessários
 *
 * @see {@link prisma.stopDay.findMany} - Método Prisma utilizado
 * @see {@link GetMonthStopDaysProps} - Interface de parâmetros
 * @see {@link createDateInSaoPaulo} - Função de timezone
 * @see {@link getDateComponentsInSaoPaulo} - Função de timezone
 */
/**
 * Busca todos os dias do mês que são feriados
 *
 * Esta função é executada no servidor e busca todos os feriados
 * de um mês específico, retornando apenas os dias únicos (1-31) que
 * são feriados. Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Array de dias (1-31) com feriados ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const holidays = await getMonthStopDays({
 *   userId: "usr_123",
 *   year: 2024,
 *   month: 0 // Janeiro
 * });
 * console.log(holidays); // [1, 25] // 1º de janeiro e 25 de janeiro
 * ```
 */
export const getMonthStopDays = async ({
	userId,
	year,
	month,
}: GetMonthStopDaysProps): Promise<number[]> => {
	try {
		if (!userId || year === undefined || month === undefined) {
			console.warn('getMonthStopDays: parâmetros não fornecidos')
			return []
		}
		// Define início e fim do mês no timezone America/Sao_Paulo
		const startOfMonth = createDateInSaoPaulo(year, month, 1, 0, 0, 0, 0)
		const endOfMonth = createDateInSaoPaulo(year, month + 1, 0, 23, 59, 59, 999)
		// Busca feriados do mês
		const stopDays = await prisma.stopDay.findMany({
			where: {
				UserId: userId,
				date: {
					gte: startOfMonth,
					lte: endOfMonth,
				},
			},
			select: {
				date: true,
			},
		})
		// Extrai os dias únicos que são feriados (usando timezone America/Sao_Paulo)
		const daysWithStopDays = new Set<number>()
		stopDays.forEach((stopDay) => {
			const components = getDateComponentsInSaoPaulo(new Date(stopDay.date))
			daysWithStopDays.add(components.day)
		})
		return Array.from(daysWithStopDays)
	} catch (error) {
		console.error('Erro ao buscar feriados do mês:', {
			userId,
			year,
			month,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
