/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: retorna a data do próximo agendamento (primeiro a partir de hoje) no timezone America/Sao_Paulo; usado para inicializar o calendário.
 *
 * @example
 * const nextDate = await getNextAppointmentDate({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { getNowInSaoPaulo, startOfDayInSaoPaulo } from '@/utils/date-timezone'
interface GetNextAppointmentDateProps {
	/** ID único do usuário (empresa) */
	userId: string
}
/**
 *  Data Access Layer - Próxima Data de Agendamento
 *
 * Camada de acesso a dados responsável por buscar a data do próximo
 * agendamento (mais próximo ou hoje se houver agendamento hoje). Utiliza
 * Prisma ORM para consultas seguras e tipadas ao banco de dados PostgreSQL.
 * Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca do primeiro agendamento a partir de hoje
 * -  Ordenação por data (crescente)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com Date ou null
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type NextAppointmentDate = Date | null;
 * // Retorna a data do próximo agendamento ou null se não houver
 * ```
 *
 * ## Tratamento de Timezone
 * - **Data de hoje**: Calculada no timezone America/Sao_Paulo
 * - **Busca**: Agendamentos a partir de hoje (>= hoje 00:00:00)
 * - **Ordenação**: Primeiro agendamento encontrado (mais próximo)
 *
 * ## Cenários de Uso
 * - Inicialização do calendário com próxima data
 * - Navegação automática para próximo agendamento
 * - Indicadores de próximos eventos
 * - Foco automático na agenda diária
 *
 * ## Estratégias de Cache
 * - Data do próximo agendamento cacheável por sessão
 * - Revalidação necessária após criação/atualização
 * - Considerar cache em memória para alta frequência
 *
 * ## Segurança
 * - Validação de entrada obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios agendamentos
 *
 * ## Performance
 * - Consulta otimizada com findFirst
 * - Índices recomendados na tabela Appointment(userId, appointmentDate)
 * - Ordenação otimizada
 * - Retorno apenas do campo necessário
 *
 * @see {@link prisma.appointment.findFirst} - Método Prisma utilizado
 * @see {@link GetNextAppointmentDateProps} - Interface de parâmetros
 * @see {@link getNowInSaoPaulo} - Função de timezone
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 */
/**
 * Busca a data do próximo agendamento
 *
 * Esta função é executada no servidor e busca o primeiro agendamento
 * a partir de hoje, retornando sua data. Usado para inicializar o
 * calendário na data correta. Todas as datas são tratadas no timezone
 * America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Data do próximo agendamento ou null se não houver
 *
 * @example
 * ```typescript
 * const nextDate = await getNextAppointmentDate({ userId: "usr_123" });
 * if (nextDate) {
 *   console.log(nextDate); // Date("2024-01-15T14:00:00")
 * } else {
 *   console.log("Não há agendamentos futuros");
 * }
 * ```
 */
export const getNextAppointmentDate = async ({
	userId,
}: GetNextAppointmentDateProps) => {
	try {
		// Verifica autenticacao e autorizacao
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) return null
		if (!userId) {
			console.warn('getNextAppointmentDate: userId não fornecido')
			return null
		}
		// Cria data de hoje no timezone America/Sao_Paulo
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		// Busca o primeiro agendamento a partir de hoje
		const appointment = await prisma.appointment.findFirst({
			where: {
				userId: userId,
				appointmentDate: {
					gte: today,
				},
			},
			orderBy: {
				appointmentDate: 'asc',
			},
			select: {
				appointmentDate: true,
			},
		})
		if (appointment) {
			return appointment.appointmentDate
		}
		return null
	} catch (error) {
		console.error('Erro ao buscar próxima data de agendamento:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
