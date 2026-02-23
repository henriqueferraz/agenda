/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca todos os bloqueios de horário do usuário, incluindo dados
 * do funcionário vinculado, ordenados por data e horário (crescente).
 *
 * @example
 * const blocks = await getAllBlockedTimes({ userId: 'usr_123' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/** Props para buscar todos os bloqueios de horário */
interface GetAllBlockedTimesProps {
	/** ID único do usuário (empresa) */
	userId: string
}

/** Tipo retornado por getAllBlockedTimes */
export interface BlockedTimeWithEmployee {
	/** ID do bloqueio */
	id: string
	/** Data do bloqueio */
	date: Date
	/** Slot bloqueado no formato HH:MM */
	time: string
	/** Motivo do bloqueio */
	motivation: string
	/** ID do funcionário */
	employeeId: string
	/** Data de criação */
	createdAt: Date
	/** Data de atualização */
	updatedAt: Date
	/** Dados do funcionário vinculado */
	employee: {
		/** ID do funcionário */
		id: string
		/** Nome do funcionário */
		name: string
	}
}

/**
 * Busca todos os bloqueios de horário cadastrados pelo usuário, com dados
 * do funcionário vinculado, ordenados por data e horário.
 *
 * @param props - Propriedades da consulta ({ userId })
 * @returns Array de bloqueios com dados do funcionário, ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const blocks = await getAllBlockedTimes({ userId: "usr_123" })
 * console.log(blocks[0].employee.name) // "João"
 * console.log(blocks[0].time) // "14:00"
 * ```
 */
export const getAllBlockedTimes = async ({
	userId,
}: GetAllBlockedTimesProps): Promise<BlockedTimeWithEmployee[]> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) return []

		if (!userId) {
			console.warn('getAllBlockedTimes: userId não fornecido')
			return []
		}

		const blockedTimes = await prisma.blockedTime.findMany({
			where: { UserId: userId },
			include: {
				employee: {
					select: { id: true, name: true },
				},
			},
			orderBy: [{ date: 'asc' }, { time: 'asc' }],
		})

		return blockedTimes
	} catch (error) {
		console.error('Erro ao buscar bloqueios de horário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
