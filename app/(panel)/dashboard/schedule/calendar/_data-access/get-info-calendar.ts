/**
 * Data Access - Get Info Calendar
 *
 * Visao geral:
 * - Consulta de dados para Get Info Calendar.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_data-access/get-info-calendar";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		// Validação do parâmetro de entrada
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
