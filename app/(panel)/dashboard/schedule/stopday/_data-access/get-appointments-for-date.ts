/**
 * Data Access - Get Appointments For Date
 *
 * Visao geral:
 * - Consulta de dados para Get Appointments For Date.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Executar leitura de dados de forma segura.
 * - Aplicar filtros e ordenacoes de dominio.
 * - Garantir consistencia dos retornos.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/schedule/stopday/_data-access/get-appointments-for-date";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
import { startOfDayInSaoPaulo, endOfDayInSaoPaulo } from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface GetAppointmentsForDateProps {
	/** ID único do usuário (empresa) */
	userId: string
	/** Data para verificar agendamentos */
	date: Date
}
export interface AppointmentInfo {
	id: string
	name: string
	email: string
	phone: string
	time: string
	service: {
		id: string
		name: string
	}
	employee: {
		id: string
		name: string
	}
}
/**
 *  Data Access Layer - Agendamentos para Data
 *
 * Camada de acesso a dados responsável por buscar todos os agendamentos
 * de uma data específica. Utilizado principalmente para verificar se há
 * agendamentos antes de criar um feriado. Utiliza Prisma ORM para consultas
 * seguras e tipadas ao banco de dados PostgreSQL. Todas as datas são
 * tratadas no timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de agendamentos por usuário e data
 * -  Inclusão de informações de serviço e funcionário
 * -  Ordenação por horário (crescente)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos customizados
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type AppointmentInfo = Array<{
 *   id: string;
 *   name: string;
 *   email: string;
 *   phone: string;
 *   time: string;
 *   service: {
 *     id: string;
 *     name: string;
 *   };
 *   employee: {
 *     id: string;
 *     name: string;
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
 * - Verificação de agendamentos antes de criar feriado
 * - Aviso ao usuário sobre agendamentos existentes
 * - Listagem de agendamentos do dia
 * - Validação de disponibilidade
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
 * @see {@link GetAppointmentsForDateProps} - Interface de parâmetros
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 * @see {@link endOfDayInSaoPaulo} - Função de timezone
 */
/**
 * Busca todos os agendamentos de uma data específica
 *
 * Esta função é executada no servidor e busca todos os agendamentos de uma
 * data específica, incluindo informações de serviço e funcionário. Usada
 * principalmente para verificar se há agendamentos antes de criar um feriado.
 * Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Array de agendamentos do dia ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const appointments = await getAppointmentsForDate({
 *   userId: "usr_123",
 *   date: new Date("2024-01-15")
 * });
 * console.log(appointments.length); // 3
 * console.log(appointments[0].name); // "João Silva"
 * ```
 */
export const getAppointmentsForDate = async ({
	userId,
	date,
}: GetAppointmentsForDateProps): Promise<AppointmentInfo[]> => {
	try {
		if (!userId || !date) {
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
		return appointments.map((apt) => ({
			id: apt.id,
			name: apt.name,
			email: apt.email,
			phone: apt.phone,
			time: apt.time,
			service: {
				id: apt.service.id,
				name: apt.service.name,
			},
			employee: {
				id: apt.employee.id,
				name: apt.employee.name,
			},
		}))
	} catch (error) {
		console.error('Erro ao buscar agendamentos da data:', {
			userId,
			date,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
