/**
 * Data Access - Get Appointment Dates
 *
 * Visao geral:
 * - Consulta de dados para Get Appointment Dates.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_data-access/get-appointment-dates";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
} from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface GetAppointmentDatesProps {
	/** ID único do usuário (empresa) */
	userId: string
}
/**
 *  Data Access Layer - Datas com Agendamentos
 *
 * Camada de acesso a dados responsável por buscar todas as datas únicas
 * que possuem agendamentos a partir de hoje. Utiliza Prisma ORM para
 * consultas seguras e tipadas ao banco de dados PostgreSQL. Todas as
 * datas são tratadas no timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de datas com agendamentos a partir de hoje
 * -  Extração de datas únicas (sem hora)
 * -  Ordenação cronológica
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Date
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type AppointmentDates = Date[]; // Array de datas únicas ordenadas
 * ```
 *
 * ## Tratamento de Timezone
 * - **Data de hoje**: Calculada no timezone America/Sao_Paulo
 * - **Extração de datas**: Componentes extraídos no timezone America/Sao_Paulo
 * - **Criação de datas**: Datas criadas no timezone America/Sao_Paulo
 * - **Ordenação**: Datas ordenadas cronologicamente
 *
 * ## Cenários de Uso
 * - Seleção de datas na agenda diária
 * - Filtro de datas disponíveis
 * - Navegação entre dias com agendamentos
 * - Indicadores visuais no calendário
 *
 * ## Estratégias de Cache
 * - Lista de datas cacheáveis por sessão
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
 * - Processamento eficiente de datas únicas
 * - Ordenação otimizada
 *
 * @see {@link prisma.appointment.findMany} - Método Prisma utilizado
 * @see {@link GetAppointmentDatesProps} - Interface de parâmetros
 * @see {@link getNowInSaoPaulo} - Função de timezone
 * @see {@link startOfDayInSaoPaulo} - Função de timezone
 * @see {@link getDateComponentsInSaoPaulo} - Função de timezone
 * @see {@link createDateInSaoPaulo} - Função de timezone
 */
/**
 * Busca todas as datas únicas com agendamentos a partir de hoje
 *
 * Esta função é executada no servidor e busca todas as datas que possuem
 * agendamentos, retornando apenas as datas únicas (sem hora) ordenadas
 * cronologicamente. Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * @param props - Propriedades da consulta
 * @returns Array de datas únicas com agendamentos ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const dates = await getAppointmentDates({ userId: "usr_123" });
 * console.log(dates.length); // 10
 * console.log(dates[0]); // Date("2024-01-15")
 * ```
 */
export const getAppointmentDates = async ({
	userId,
}: GetAppointmentDatesProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		if (!userId) {
			console.warn('getAppointmentDates: userId não fornecido')
			return []
		}
		// Cria data de hoje no timezone America/Sao_Paulo
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		// Busca todos os agendamentos a partir de hoje
		const appointments = await prisma.appointment.findMany({
			where: {
				userId: userId,
				appointmentDate: {
					gte: today,
				},
			},
			select: {
				appointmentDate: true,
			},
			orderBy: {
				appointmentDate: 'asc',
			},
		})
		// Extrai as datas únicas (sem hora) usando timezone America/Sao_Paulo
		const uniqueDates = new Set<string>()
		appointments.forEach((apt) => {
			// Obtém componentes da data no timezone America/Sao_Paulo
			const components = getDateComponentsInSaoPaulo(
				new Date(apt.appointmentDate),
			)
			const dateStr = `${components.year}-${String(components.month + 1).padStart(2, '0')}-${String(components.day).padStart(2, '0')}`
			uniqueDates.add(dateStr)
		})
		// Converte para array de Date usando timezone America/Sao_Paulo e ordena
		const dates = Array.from(uniqueDates)
			.map((dateStr) => {
				// Cria data no timezone America/Sao_Paulo
				const [year, month, day] = dateStr.split('-').map(Number)
				return createDateInSaoPaulo(year, month - 1, day)
			})
			.sort((a, b) => a.getTime() - b.getTime())
		return dates
	} catch (error) {
		console.error('Erro ao buscar datas de agendamentos:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
