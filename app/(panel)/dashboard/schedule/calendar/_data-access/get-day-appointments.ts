/**
 * Data Access: busca agendamentos de um dia específico (timezone America/Sao_Paulo), com serviço e funcionário; valida autenticação e userId.
 *
 * @example
 * const appointments = await getDayAppointments({ userId: 'usr_123', date: new Date() });
 */
'use server'
import prisma from '@/lib/prisma'
import { startOfDayInSaoPaulo, endOfDayInSaoPaulo } from '@/utils/date-timezone'
import { getUserFromToken } from '@/lib/auth'
interface GetDayAppointmentsProps {
	/** ID único do usuário (empresa) */
	userId: string
	/** Data para buscar agendamentos */
	date: Date
}
/**
 * Data Access Layer - Agendamentos do Dia
 *
 * Camada de acesso a dados responsável por buscar todos os agendamentos
 * de um dia específico. Utiliza Prisma ORM para consultas seguras e tipadas
 * ao banco de dados PostgreSQL. Todas as datas são tratadas no timezone
 * America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de agendamentos por usuário e data
 * -  Inclusão de informações de serviço e funcionário
 * -  Ordenação por horário (crescente)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Prisma
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type DayAppointments = Array<{
 *   id: string;
 *   name: string;
 *   email: string;
 *   phone: string;
 *   appointmentDate: Date;
 *   time: string;
 *   service: {
 *     id: string;
 *     name: string;
 *     price: number;
 *     duration: number;
 *   };
 *   employee: {
 *     id: string;
 *     name: string;
 *     email: string;
 *   };
 * }>;
 * ```
 *
 * ## Tratamento de Timezone
 * - **Início do dia**: 00:00:00 no timezone America/Sao_Paulo
 * - **Fim do dia**: 23:59:59 no timezone America/Sao_Paulo
 * - **Comparações**: Todas as comparações usam timezone America/Sao_Paulo
 *
 * ## Cenários de Uso
 * - Exibição da agenda diária
 * - Listagem de agendamentos do dia
 * - Verificação de disponibilidade
 * - Relatórios diários
 *
 * ## Estratégias de Cache
 * - Agendamentos do dia cacheáveis por sessão
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
 * - Consulta única com JOIN otimizado
 * - Índices recomendados na tabela Appointment(userId, appointmentDate)
 * - Ordenação por horário para melhor UX
 * - Retorno apenas dos campos necessários
 *
 * @see {@link prisma.appointment.findMany} - Método Prisma utilizado
 * @see {@link GetDayAppointmentsProps} - Interface de parâmetros
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 * @see {@link endOfDayInSaoPaulo} - Função de timezone
 */
/**
 * Busca todos os agendamentos de um dia específico
 *
 * Esta função é executada no servidor e busca todos os agendamentos
 * de um dia específico, incluindo informações de serviço e funcionário.
 * Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Array de agendamentos do dia ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const appointments = await getDayAppointments({
 *   userId: "usr_123",
 *   date: new Date("2024-01-15")
 * });
 * console.log(appointments.length); // 5
 * console.log(appointments[0].name); // "João Silva"
 * ```
 */
export const getDayAppointments = async ({
	userId,
	date,
}: GetDayAppointmentsProps) => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			console.warn('getDayAppointments: usuario nao autenticado')
			return []
		}
		if (!userId || !date) {
			console.warn('getDayAppointments: parâmetros não fornecidos')
			return []
		}
		if (session.id !== userId) {
			console.warn(
				'getDayAppointments: userId nao corresponde ao usuario autenticado',
			)
			return []
		}
		// Define início e fim do dia usando timezone America/Sao_Paulo
		const startOfDay = startOfDayInSaoPaulo(date)
		const endOfDay = endOfDayInSaoPaulo(date)
		// Busca agendamentos do dia
		const appointments = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: startOfDay,
					lte: endOfDay,
				},
			},
			include: {
				service: true,
				employee: true,
			},
			orderBy: {
				time: 'asc',
			},
		})
		return appointments
	} catch (error) {
		console.error('Erro ao buscar agendamentos do dia:', {
			userId,
			date,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
