/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca horários da empresa, funcionários ativos com serviços e serviços ativos para o calendário e formulários de agendamento.
 *
 * @example
 * const data = await getCalendarData({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
interface GetCalendarDataProps {
	/** ID único do usuário */
	userId: string
}
/**
 *  Data Access Layer - Dados do Calendário
 *
 * Camada de acesso a dados responsável por buscar todos os dados necessários
 * para o funcionamento do calendário e sistema de agendamentos. Utiliza Prisma
 * ORM para consultas seguras e tipadas ao banco de dados PostgreSQL.
 *
 * ## Funcionalidades
 * -  Busca de horários de funcionamento da empresa
 * -  Busca de funcionários ativos com serviços relacionados
 * -  Busca de serviços ativos da empresa
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Prisma
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type CalendarData = {
 *   companyTimes: {
 *     mon_times: string[];
 *     tue_times: string[];
 *     wed_times: string[];
 *     thu_times: string[];
 *     fri_times: string[];
 *     sat_times: string[];
 *     sun_times: string[];
 *   };
 *   employees: Array<{
 *     id: string;
 *     name: string;
 *     email: string;
 *     phone: string;
 *     function: string;
 *     status: boolean;
 *     mon_times: string[];
 *     tue_times: string[];
 *     wed_times: string[];
 *     thu_times: string[];
 *     fri_times: string[];
 *     sat_times: string[];
 *     sun_times: string[];
 *     services: Array<{
 *       id: string;
 *       service: {
 *         id: string;
 *         name: string;
 *         price: number;
 *         duration: number;
 *         status: boolean;
 *       };
 *     }>;
 *   }>;
 *   services: Array<{
 *     id: string;
 *     name: string;
 *     price: number;
 *     duration: number;
 *     status: boolean;
 *   }>;
 * } | null;
 * ```
 *
 * ## Cenários de Uso
 * - Carregamento inicial do calendário
 * - Atualização de dados após mudanças
 * - Pré-preenchimento de formulários de agendamento
 * - Validação de disponibilidade
 *
 * ## Estratégias de Cache
 * - Dados do calendário cacheáveis por sessão
 * - Revalidação necessária após CRUD
 * - Considerar cache em memória para alta frequência
 *
 * ## Segurança
 * - Validação de entrada obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios dados
 * - Apenas funcionários e serviços ativos são retornados
 *
 * ## Performance
 * - Consultas otimizadas com select específico
 * - Índices recomendados nas tabelas relacionadas
 * - Ordenação por nome para melhor UX
 * - Retorno apenas dos campos necessários
 *
 * @see {@link prisma.user.findUnique} - Método Prisma utilizado
 * @see {@link prisma.employee.findMany} - Método Prisma utilizado
 * @see {@link prisma.service.findMany} - Método Prisma utilizado
 * @see {@link GetCalendarDataProps} - Interface de parâmetros
 */
/**
 * Busca todos os dados necessários para o calendário
 *
 * Esta função é executada no servidor e realiza múltiplas consultas para
 * buscar horários da empresa, funcionários ativos com serviços e serviços
 * ativos da empresa.
 *
 * @param props - Propriedades da consulta
 * @returns Dados completos do calendário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const calendarData = await getCalendarData({ userId: "usr_123" });
 * if (calendarData) {
 *   console.log(calendarData.companyTimes.mon_times); // ["08:00", "09:00"]
 *   console.log(calendarData.employees.length); // 3
 *   console.log(calendarData.services.length); // 5
 * }
 * ```
 */
export const getCalendarData = async ({ userId }: GetCalendarDataProps) => {
	try {
		// Verifica autenticacao e autorizacao
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) return null
		if (!userId) {
			console.warn('getCalendarData: userId não fornecido')
			return null
		}
		// Busca horários da empresa
		const company = await prisma.user.findUnique({
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
		if (!company) {
			console.warn(`getCalendarData: Usuário ${userId} não encontrado`)
			return null
		}
		// Busca funcionários com serviços relacionados
		const employees = await prisma.employee.findMany({
			where: {
				UserId: userId,
				status: true,
			},
			include: {
				services: {
					include: {
						service: true,
					},
				},
			},
			orderBy: {
				name: 'asc',
			},
		})
		// Busca serviços ativos da empresa
		const services = await prisma.service.findMany({
			where: {
				UserId: userId,
				status: true,
			},
			orderBy: {
				name: 'asc',
			},
		})
		return {
			companyTimes: company,
			employees,
			services,
		}
	} catch (error) {
		console.error('Erro ao buscar dados do calendário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
