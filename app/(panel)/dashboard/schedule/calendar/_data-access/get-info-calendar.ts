/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca usuário com agendamentos, funcionários e serviços para exibição/relatórios do calendário.
 *
 * @example
 * const calendarInfo = await getInfoCalendar({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
interface GetInfoCalendarProps {
	/** ID único do usuário */
	userId: string
}
/**
 *  Data Access Layer - Informações do Calendário
 *
 * Camada de acesso a dados responsável por buscar informações completas do
 * usuário incluindo agendamentos, funcionários e serviços. Utiliza Prisma
 * ORM para consultas seguras e tipadas ao banco de dados PostgreSQL.
 *
 * ## Funcionalidades
 * -  Busca de usuário com relacionamentos completos
 * -  Inclusão de agendamentos, funcionários e serviços
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Prisma
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type CalendarInfo = Array<{
 *   id: string;
 *   name: string;
 *   email: string;
 *   appointment: Appointment[];
 *   employee: Employee[];
 *   service: Service[];
 *   // ... outros campos do User
 * }>;
 * ```
 *
 * ## Cenários de Uso
 * - Visualização completa de dados do usuário
 * - Relatórios e dashboards
 * - Análise de agendamentos
 * - Gestão de funcionários e serviços
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
 *
 * ## Performance
 * - Consulta única com JOIN otimizado
 * - Índices recomendados nas tabelas relacionadas
 * - Retorno completo de relacionamentos
 *
 * @see {@link prisma.user.findMany} - Método Prisma utilizado
 * @see {@link GetInfoCalendarProps} - Interface de parâmetros
 */
/**
 * Busca informações completas do calendário
 *
 * Esta função é executada no servidor e busca todas as informações
 * relacionadas ao calendário, incluindo agendamentos, funcionários
 * e serviços do usuário.
 *
 * @param props - Propriedades da consulta
 * @returns Array de usuários com relacionamentos ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const calendarInfo = await getInfoCalendar({ userId: "usr_123" });
 * console.log(calendarInfo[0].appointment.length); // 10
 * console.log(calendarInfo[0].employee.length); // 3
 * ```
 */
export const getInfoCalendar = async ({ userId }: GetInfoCalendarProps) => {
	try {
		// Verifica autenticacao e autorizacao
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) return []
		if (!userId) {
			console.warn('getInfoCalendar: userId não fornecido')
			return []
		}
		// Busca funcionários no banco de dados com serviços relacionados
		const users = await prisma.user.findMany({
			where: {
				id: userId,
			},
			include: {
				appointment: true,
				employee: true,
				service: true,
			},
		})
		return users
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações do calendário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
