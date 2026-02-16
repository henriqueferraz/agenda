/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: calcula e retorna estatísticas do dashboard (agendamentos hoje/ontem, clientes únicos, horários disponíveis, receita mensal) no timezone America/Sao_Paulo.
 *
 * @example
 * const stats = await getInfoDashboard({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	endOfDayInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
} from '@/utils/date-timezone'
interface GetInfoDashboardProps {
	/** ID único do usuário */
	userId: string
}
interface DashboardStats {
	appointmentsToday: number
	appointmentsYesterday: number
	uniqueClients: number
	uniqueClientsThisMonth: number
	availableSlotsToday: number
	monthlyRevenue: number
	monthlyRevenueLastMonth: number
}
/**
 *  Data Access Layer - Estatísticas do Dashboard
 *
 * Camada de acesso a dados responsável por buscar estatísticas do dashboard.
 * Utiliza Prisma ORM para consultas seguras e tipadas ao banco de dados PostgreSQL.
 * Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Contagem de agendamentos de hoje
 * -  Contagem de agendamentos de ontem (para comparação)
 * -  Contagem de clientes únicos (por email)
 * -  Contagem de clientes únicos deste mês
 * -  Cálculo de horários disponíveis hoje
 * -  Cálculo de receita mensal
 * -  Cálculo de receita do mês passado (para comparação)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type DashboardStats = {
 *   appointmentsToday: number;           // Agendamentos de hoje
 *   appointmentsYesterday: number;        // Agendamentos de ontem
 *   uniqueClients: number;                // Total de clientes únicos
 *   uniqueClientsThisMonth: number;       // Novos clientes do mês
 *   availableSlotsToday: number;          // Horários livres hoje
 *   monthlyRevenue: number;              // Receita do mês atual
 *   monthlyRevenueLastMonth: number;      // Receita do mês passado
 * };
 * ```
 *
 * ## Cálculos Realizados
 * ### Agendamentos
 * - **Hoje**: Contagem de agendamentos entre 00:00 e 23:59:59 de hoje
 * - **Ontem**: Contagem de agendamentos do dia anterior
 * - **Comparação**: Diferença calculada no frontend
 *
 * ### Clientes
 * - **Únicos**: Set de emails únicos de todos os agendamentos
 * - **Este mês**: Set de emails únicos dos agendamentos do mês atual
 *
 * ### Horários Disponíveis
 * - **Horários da empresa**: Busca horários configurados para o dia da semana atual
 * - **Horários ocupados**: Busca agendamentos de hoje
 * - **Disponíveis**: Diferença entre horários da empresa e ocupados
 *
 * ### Receita
 * - **Mensal**: Soma dos preços dos serviços agendados no mês atual
 * - **Mês passado**: Soma dos preços dos serviços agendados no mês anterior
 * - **Comparação**: Percentual calculado no frontend
 *
 * ## Cenários de Uso
 * - Carregamento inicial do dashboard
 * - Atualização de métricas em tempo real
 * - Relatórios e analytics
 * - Monitoramento de performance do negócio
 *
 * ## Estratégias de Cache
 * - Dados do dashboard cacheáveis por sessão
 * - Revalidação necessária após criação de agendamentos
 * - Considerar cache em memória para alta frequência
 *
 * ## Segurança
 * - Validação de entrada obrigatória (userId)
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios dados
 *
 * ## Performance
 * - Múltiplas consultas otimizadas
 * - Índices recomendados: Appointment(userId, appointmentDate)
 * - Agregações eficientes (count, reduce)
 * - Sem queries N+1
 *
 * ## Tratamento de Timezone
 * - Todas as datas no timezone America/Sao_Paulo
 * - Cálculo correto de início/fim do dia
 * - Cálculo correto de início/fim do mês
 * - Dia da semana calculado no timezone correto
 *
 * @see {@link GetInfoDashboardProps} - Interface de parâmetros
 * @see {@link DashboardStats} - Interface de retorno
 * @see {@link getNowInSaoPaulo} - Função de timezone
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 * @see {@link endOfDayInSaoPaulo} - Função de timezone
 */
/**
 * Busca estatísticas completas do dashboard
 *
 * Esta função é executada no servidor e realiza múltiplas consultas ao banco
 * de dados para calcular todas as estatísticas necessárias para o dashboard.
 * Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Estatísticas completas do dashboard ou valores padrão em caso de erro
 *
 * @example
 * ```typescript
 * const stats = await getInfoDashboard({ userId: "usr_123" });
 * console.log(stats.appointmentsToday); // 5
 * console.log(stats.uniqueClients); // 48
 * console.log(stats.monthlyRevenue); // 2450.00
 * ```
 */
const DEFAULT_DASHBOARD_STATS: DashboardStats = {
	appointmentsToday: 0,
	appointmentsYesterday: 0,
	uniqueClients: 0,
	uniqueClientsThisMonth: 0,
	availableSlotsToday: 0,
	monthlyRevenue: 0,
	monthlyRevenueLastMonth: 0,
}

export const getInfoDashboard = async ({
	userId,
}: GetInfoDashboardProps): Promise<DashboardStats> => {
	try {
		// Verifica autenticacao e autorizacao
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) return DEFAULT_DASHBOARD_STATS
		if (!userId) {
			console.warn('getInfoDashboard: userId não fornecido')
			return DEFAULT_DASHBOARD_STATS
		}
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		const endToday = endOfDayInSaoPaulo(now)
		// Data de ontem
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)
		const startYesterday = startOfDayInSaoPaulo(yesterday)
		const endYesterday = endOfDayInSaoPaulo(yesterday)
		// Componentes da data atual para cálculos mensais
		const todayComponents = getDateComponentsInSaoPaulo(now)
		const startOfMonth = createDateInSaoPaulo(
			todayComponents.year,
			todayComponents.month,
			1,
			0,
			0,
			0,
			0,
		)
		const endOfMonth = endOfDayInSaoPaulo(
			createDateInSaoPaulo(
				todayComponents.year,
				todayComponents.month + 1,
				0,
				23,
				59,
				59,
				999,
			),
		)
		// Mês passado
		const lastMonth =
			todayComponents.month === 0 ? 11 : todayComponents.month - 1
		const lastMonthYear =
			todayComponents.month === 0
				? todayComponents.year - 1
				: todayComponents.year
		const startOfLastMonth = createDateInSaoPaulo(
			lastMonthYear,
			lastMonth,
			1,
			0,
			0,
			0,
			0,
		)
		const endOfLastMonth = endOfDayInSaoPaulo(
			createDateInSaoPaulo(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999),
		)
		// Busca agendamentos de hoje
		const appointmentsToday = await prisma.appointment.count({
			where: {
				userId: userId,
				appointmentDate: {
					gte: today,
					lte: endToday,
				},
			},
		})
		// Busca agendamentos de ontem
		const appointmentsYesterday = await prisma.appointment.count({
			where: {
				userId: userId,
				appointmentDate: {
					gte: startYesterday,
					lte: endYesterday,
				},
			},
		})
		// Busca clientes únicos (por email) - todos os tempos
		const allAppointments = await prisma.appointment.findMany({
			where: {
				userId: userId,
			},
			select: {
				email: true,
			},
		})
		const uniqueClients = new Set(allAppointments.map((apt) => apt.email)).size
		// Busca clientes únicos deste mês
		const appointmentsThisMonth = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: startOfMonth,
					lte: endOfMonth,
				},
			},
			select: {
				email: true,
			},
		})
		const uniqueClientsThisMonth = new Set(
			appointmentsThisMonth.map((apt) => apt.email),
		).size
		// Calcula horários disponíveis hoje
		// Busca horários da empresa para hoje
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				mon_times: true,
				tue_times: true,
				wed_times: true,
				thu_times: true,
				fri_times: true,
				sat_times: true,
				sun_times: true,
			},
		})
		// Obtém o dia da semana no timezone America/Sao_Paulo
		// getDay() retorna 0 = domingo, 1 = segunda, etc.
		// Mas precisamos garantir que está usando o timezone correto
		const dayOfWeek = new Date(
			now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
		).getDay()
		const dayTimesMap: Record<number, string[]> = {
			0: user?.sun_times || [],
			1: user?.mon_times || [],
			2: user?.tue_times || [],
			3: user?.wed_times || [],
			4: user?.thu_times || [],
			5: user?.fri_times || [],
			6: user?.sat_times || [],
		}
		const availableTimes = dayTimesMap[dayOfWeek] || []
		// Busca agendamentos de hoje para calcular horários ocupados
		const todayAppointments = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: today,
					lte: endToday,
				},
			},
			select: {
				time: true,
			},
		})
		const occupiedTimes = new Set(todayAppointments.map((apt) => apt.time))
		const availableSlotsToday = availableTimes.filter(
			(time) => !occupiedTimes.has(time),
		).length
		// Calcula receita mensal (soma dos preços dos serviços agendados)
		const appointmentsThisMonthWithService = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: startOfMonth,
					lte: endOfMonth,
				},
			},
			include: {
				service: {
					select: {
						price: true,
					},
				},
			},
		})
		const monthlyRevenue = appointmentsThisMonthWithService.reduce(
			(sum, apt) => sum + (apt.service.price || 0),
			0,
		)
		// Calcula receita do mês passado
		const appointmentsLastMonthWithService = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: startOfLastMonth,
					lte: endOfLastMonth,
				},
			},
			include: {
				service: {
					select: {
						price: true,
					},
				},
			},
		})
		const monthlyRevenueLastMonth = appointmentsLastMonthWithService.reduce(
			(sum, apt) => sum + (apt.service.price || 0),
			0,
		)
		return {
			appointmentsToday,
			appointmentsYesterday,
			uniqueClients,
			uniqueClientsThisMonth,
			availableSlotsToday,
			monthlyRevenue,
			monthlyRevenueLastMonth,
		}
	} catch (error) {
		console.error('Erro ao buscar informações do dashboard:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return DEFAULT_DASHBOARD_STATS
	}
}
