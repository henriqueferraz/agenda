/**
 * Data Access: wrapper que delega para getAllStopDays; retorna todos os feriados do usuário ou array vazio em caso de erro.
 *
 * @example
 * const stopDays = await getStopDay({ userId: 'usr_123' });
 */
'use server'
import { getAllStopDays } from './get-all-stopdays'
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
