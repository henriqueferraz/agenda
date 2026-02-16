/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca todos os feriados (stopdays) do usuário ordenados por data (crescente).
 *
 * @example
 * const stopDays = await getAllStopDays({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
interface GetAllStopDaysProps {
	/** ID único do usuário (empresa) */
	userId: string
}
export interface StopDay {
	id: string
	date: Date
	motivation: string
	createdAt: Date
	updatedAt: Date
}
/**
 * Data Access Layer - Todos os Feriados
 *
 * Camada de acesso a dados responsável por buscar todos os feriados
 * cadastrados pela empresa. Utiliza Prisma ORM para consultas seguras e
 * tipadas ao banco de dados PostgreSQL. Retorna feriados ordenados por data.
 *
 * ## Funcionalidades
 * -  Busca de todos os feriados por userId
 * -  Ordenação por data (crescente)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Prisma
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
 * - Listagem completa de feriados
 * - Exibição em tabelas e listas
 * - Filtros e buscas
 * - Relatórios de feriados
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
 * - Consulta única otimizada
 * - Índices recomendados na tabela StopDay(UserId, date)
 * - Ordenação por data para melhor UX
 * - Retorno completo de todos os campos
 *
 * @see {@link prisma.stopDay.findMany} - Método Prisma utilizado
 * @see {@link GetAllStopDaysProps} - Interface de parâmetros
 */
/**
 * Busca todos os feriados cadastrados
 *
 * Esta função é executada no servidor e busca todos os feriados cadastrados
 * pela empresa, ordenados por data (crescente).
 *
 * @param props - Propriedades da consulta
 * @returns Array de feriados ordenados por data ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const stopDays = await getAllStopDays({ userId: "usr_123" });
 * console.log(stopDays.length); // 5
 * console.log(stopDays[0].motivation); // "Feriado Nacional"
 * ```
 */
export const getAllStopDays = async ({
	userId,
}: GetAllStopDaysProps): Promise<StopDay[]> => {
	try {
		// Verifica autenticacao e autorizacao
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) return []
		if (!userId) {
			console.warn('getAllStopDays: userId não fornecido')
			return []
		}
		const stopDays = await prisma.stopDay.findMany({
			where: {
				UserId: userId,
			},
			orderBy: {
				date: 'asc',
			},
		})
		return stopDays
	} catch (error) {
		console.error('Erro ao buscar feriados:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
