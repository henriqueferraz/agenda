/**
 * Data Access - Get Month Appointments
 *
 * Visao geral:
 * - Consulta de dados para Get Month Appointments.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_data-access/get-month-appointments";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
import {
	createDateInSaoPaulo,
	getDateComponentsInSaoPaulo,
} from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface GetMonthAppointmentsProps {
	/** ID único do usuário (empresa) */
	userId: string
	/** Ano e mês para buscar agendamentos */
	year: number
	month: number // 0-11 (janeiro = 0)
}
/**
 *  Data Access Layer - Agendamentos do Mês
 *
 * Camada de acesso a dados responsável por buscar todos os dias do mês
 * que possuem agendamentos. Utiliza Prisma ORM para consultas seguras e
 * tipadas ao banco de dados PostgreSQL. Todas as datas são tratadas no
 * timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de agendamentos por usuário, ano e mês
 * -  Extração de dias únicos com agendamentos
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com array de números (dias)
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type MonthAppointments = number[]; // Array de dias (1-31) com agendamentos
 * // Exemplo: [1, 5, 12, 15, 20] = dias 1, 5, 12, 15 e 20 têm agendamentos
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
 * - Marcação de dias no calendário mensal
 * - Indicadores visuais de dias ocupados
 * - Filtro de dias com agendamentos
 * - Relatórios mensais
 *
 * ## Estratégias de Cache
 * - Lista de dias cacheáveis por sessão
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
 * - Consulta otimizada com select específico
 * - Índices recomendados na tabela Appointment(userId, appointmentDate)
 * - Processamento eficiente de dias únicos
 * - Retorno apenas dos dias necessários
 *
 * @see {@link prisma.appointment.findMany} - Método Prisma utilizado
 * @see {@link GetMonthAppointmentsProps} - Interface de parâmetros
 * @see {@link createDateInSaoPaulo} - Função de timezone
 * @see {@link getDateComponentsInSaoPaulo} - Função de timezone
 */
/**
 * Busca todos os dias do mês que possuem agendamentos
 *
 * Esta função é executada no servidor e busca todos os agendamentos
 * de um mês específico, retornando apenas os dias únicos (1-31) que
 * possuem agendamentos. Todas as datas são tratadas no timezone
 * America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Array de dias (1-31) com agendamentos ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const days = await getMonthAppointments({
 *   userId: "usr_123",
 *   year: 2024,
 *   month: 0 // Janeiro
 * });
 * console.log(days); // [1, 5, 12, 15, 20]
 * ```
 */
export const getMonthAppointments = async ({
	userId,
	year,
	month,
}: GetMonthAppointmentsProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		if (!userId || year === undefined || month === undefined) {
			console.warn('getMonthAppointments: parâmetros não fornecidos')
			return []
		}
		// Define início e fim do mês no timezone America/Sao_Paulo
		const startOfMonth = createDateInSaoPaulo(year, month, 1, 0, 0, 0, 0)
		const endOfMonth = createDateInSaoPaulo(year, month + 1, 0, 23, 59, 59, 999)
		// Busca agendamentos do mês
		const appointments = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: startOfMonth,
					lte: endOfMonth,
				},
			},
			select: {
				appointmentDate: true,
			},
		})
		// Extrai os dias únicos que têm agendamentos (usando timezone America/Sao_Paulo)
		const daysWithAppointments = new Set<number>()
		appointments.forEach((apt) => {
			const components = getDateComponentsInSaoPaulo(
				new Date(apt.appointmentDate),
			)
			daysWithAppointments.add(components.day)
		})
		return Array.from(daysWithAppointments)
	} catch (error) {
		console.error('Erro ao buscar agendamentos do mês:', {
			userId,
			year,
			month,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
