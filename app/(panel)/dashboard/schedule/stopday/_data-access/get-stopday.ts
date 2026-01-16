/**
 * Data Access - Get Stopday
 *
 * Visao geral:
 * - Consulta de dados para Get Stopday.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import { getAllStopDays } from './get-all-stopdays'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface GetStopDayProps {
	/** ID único do usuário */
	userId: string
}
/**
 *  Data Access Layer - Feriados (Wrapper)
 *
 * Camada de acesso a dados que funciona como wrapper para a função
 * getAllStopDays. Utilizado principalmente para manter compatibilidade
 * e simplificar chamadas. Utiliza Prisma ORM para consultas seguras e
 * tipadas ao banco de dados PostgreSQL.
 *
 * ## Funcionalidades
 * -  Wrapper para getAllStopDays
 * -  Tratamento de erros simplificado
 * -  Validação de parâmetros de entrada
 * -  Logging detalhado para debugging
 * -  Retorno type-safe
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type StopDay = {
 *   id: string;
 *   date: Date;
 *   motivation: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }[];
 * ```
 *
 * ## Cenários de Uso
 * - Chamadas simplificadas de feriados
 * - Compatibilidade com código legado
 * - Wrapper para componentes que precisam de array vazio em caso de erro
 *
 * ## Estratégias de Cache
 * - Lista de feriados cacheável por sessão
 * - Revalidação necessária após CRUD
 * - Considerar cache em memória para alta frequência
 *
 * ## Segurança
 * - Validação de entrada obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios feriados
 *
 * ## Performance
 * - Delegação para getAllStopDays
 * - Mesmas otimizações da função base
 *
 * @see {@link getAllStopDays} - Função base utilizada
 * @see {@link GetStopDayProps} - Interface de parâmetros
 */
/**
 * Busca todos os feriados (wrapper)
 *
 * Esta função é um wrapper para `getAllStopDays`, mantida para compatibilidade
 * com código legado. Retorna array vazio em caso de erro.
 *
 * @param props - Propriedades da consulta
 * @returns Array de feriados ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const stopDays = await getStopDay({ userId: "usr_123" });
 * console.log(stopDays.length); // 5
 * ```
 */
export const getStopDay = async ({ userId }: GetStopDayProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		if (!userId) {
			console.warn('getStopDay: userId não fornecido')
			return []
		}
		const stopDays = await getAllStopDays({ userId })
		return stopDays
	} catch (error) {
		console.error('Erro ao buscar feriados:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
