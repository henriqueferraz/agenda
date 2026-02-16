/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca todos os lembretes do usuário ordenados por data de criação (mais antigos primeiro).
 *
 * @example
 * const reminders = await getReminders({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetRemindersProps {
	/** ID único do usuário (empresa) */
	userId: string
}
export interface Reminder {
	id: string
	description: string
	createdAt: Date
	updatedAt: Date
}
/**
 *  Data Access Layer - Lista de Lembretes
 *
 * Camada de acesso a dados responsável por buscar todos os lembretes
 * de um usuário. Utiliza Prisma ORM para consultas seguras e tipadas
 * ao banco de dados PostgreSQL.
 *
 * ## Funcionalidades
 * -  Busca de lembretes por usuário
 * -  Ordenação por data de criação (mais antigos primeiro)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 * -  Retorno type-safe com tipos Prisma
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type Reminders = Array<{
 *   id: string;
 *   description: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }>;
 * ```
 *
 * ## Ordenação
 * - Lembretes ordenados por `createdAt` em ordem crescente
 * - Mais antigos aparecem primeiro
 * - Mais novos aparecem por último
 *
 * ## Cenários de Uso
 * - Exibição da lista de tarefas no dashboard
 * - Listagem de lembretes do usuário
 * - Gerenciamento de tarefas pendentes
 *
 * ## Segurança
 * - Validação de entrada obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Acesso restrito aos próprios lembretes
 *
 * ## Performance
 * - Consulta única otimizada
 * - Índices recomendados na tabela Reminder(UserId, createdAt)
 * - Ordenação no banco de dados
 *
 * @see {@link prisma.reminder.findMany} - Método Prisma utilizado
 * @see {@link GetRemindersProps} - Interface de parâmetros
 *
 * @param props - Propriedades da consulta
 * @returns Array de lembretes ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const reminders = await getReminders({
 *   userId: "usr_123"
 * });
 * console.log(reminders.length); // 5
 * console.log(reminders[0].description); // "Ligar para cliente"
 * ```
 */
export const getReminders = async ({
	userId,
}: GetRemindersProps): Promise<Reminder[]> => {
	try {
		if (!userId) {
			console.warn('getReminders: userId não fornecido')
			return []
		}
		// Busca lembretes ordenados por data de criação (mais antigos primeiro)
		const reminders = await prisma.reminder.findMany({
			where: {
				UserId: userId,
			},
			orderBy: {
				createdAt: 'asc', // Mais antigos primeiro
			},
			select: {
				id: true,
				description: true,
				createdAt: true,
				updatedAt: true,
			},
		})
		return reminders
	} catch (error) {
		console.error('Erro ao buscar lembretes:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
