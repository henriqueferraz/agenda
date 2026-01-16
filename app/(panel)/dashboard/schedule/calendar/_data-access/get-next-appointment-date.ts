/**
 * Data Access - Get Next Appointment Date
 *
 * Visao geral:
 * - Consulta de dados para Get Next Appointment Date.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_data-access/get-next-appointment-date";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
import { getNowInSaoPaulo, startOfDayInSaoPaulo } from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
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
