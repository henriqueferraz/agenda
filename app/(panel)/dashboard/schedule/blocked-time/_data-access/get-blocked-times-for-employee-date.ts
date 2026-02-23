/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca bloqueios de horário de um funcionário em uma data específica.
 * Utilizado pela validação de agendamentos e pelos modais de agendamento para
 * filtrar slots indisponíveis.
 *
 * @example
 * const blocks = await getBlockedTimesForEmployeeDate({ employeeId: 'emp_123', date: new Date('2026-02-25'), userId: 'usr_123' })
 */
'use server'
import prisma from '@/lib/prisma'
import {
	startOfDayInSaoPaulo,
	endOfDayInSaoPaulo,
} from '@/utils/date-timezone'

/** Props para buscar bloqueios de um funcionário em uma data */
interface GetBlockedTimesForEmployeeDateProps {
	/** ID do funcionário */
	employeeId: string
	/** Data para verificar bloqueios */
	date: Date
	/** ID do usuário (empresa) */
	userId: string
}

/** Tipo retornado: apenas os campos necessários para filtragem */
export interface BlockedTimeSlot {
	/** ID do bloqueio */
	id: string
	/** Slot bloqueado no formato HH:MM */
	time: string
	/** Motivo do bloqueio */
	motivation: string
}

/**
 * Busca bloqueios de horário de um funcionário em uma data específica.
 * Retorna apenas os campos necessários para filtragem de slots (id, time, motivation).
 *
 * @param props - Propriedades da consulta (employeeId, date, userId)
 * @returns Array de bloqueios com time e motivation, ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const blocks = await getBlockedTimesForEmployeeDate({
 *   employeeId: "emp_123",
 *   date: new Date("2026-02-25"),
 *   userId: "usr_123",
 * })
 * const blockedSlots = new Set(blocks.map(b => b.time))
 * // blockedSlots: Set { "14:00", "15:30" }
 * ```
 */
export const getBlockedTimesForEmployeeDate = async ({
	employeeId,
	date,
	userId,
}: GetBlockedTimesForEmployeeDateProps): Promise<BlockedTimeSlot[]> => {
	try {
		if (!employeeId || !date || !userId) return []

		const normalizedDate = startOfDayInSaoPaulo(date)
		const dayEnd = endOfDayInSaoPaulo(date)

		const blockedTimes = await prisma.blockedTime.findMany({
			where: {
				employeeId,
				UserId: userId,
				date: { gte: normalizedDate, lt: dayEnd },
			},
			select: { id: true, time: true, motivation: true },
			orderBy: { time: 'asc' },
		})

		return blockedTimes
	} catch (error) {
		console.error('Erro ao buscar bloqueios do funcionário:', {
			employeeId,
			date,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
