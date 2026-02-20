/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca agendamentos futuros confirmados do usuário.
 * Usado pelo dialog de mensagem individual (F-07) para popular o dropdown de seleção.
 *
 * @example
 * const appointments = await getFutureAppointments({ userId: 'usr_1' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { getNowInSaoPaulo } from '@/utils/date-timezone'
import type { PeriodAppointment } from './get-appointments-by-period'

/**
 * Busca agendamentos futuros confirmados do usuário autenticado (a partir de hoje).
 *
 * @param params - userId do usuário (empresa)
 * @returns Lista de agendamentos com service e employee, ordenados por data e hora
 *
 * @example
 * ```typescript
 * const list = await getFutureAppointments({ userId: 'usr_1' })
 * // list[0].name → 'Maria Silva'
 * ```
 */
export const getFutureAppointments = async ({
	userId,
}: {
	userId: string
}): Promise<PeriodAppointment[]> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) {
			return []
		}

		const now = getNowInSaoPaulo()

		const appointments = await prisma.appointment.findMany({
			where: {
				userId,
				status: 'confirmed',
				appointmentDate: { gte: now },
			},
			include: {
				service: { select: { id: true, name: true, price: true, duration: true } },
				employee: { select: { id: true, name: true } },
				client: true,
			},
			orderBy: [{ appointmentDate: 'asc' }, { time: 'asc' }],
			take: 100,
		})

		return appointments.map((a) => ({
			id: a.id,
			name: a.client.name,
			email: a.client.email,
			phone: a.client.phone,
			appointmentDate: a.appointmentDate,
			time: a.time,
			managementToken: a.managementToken,
			service: a.service,
			employee: a.employee,
		}))
	} catch (error) {
		console.error('Erro ao buscar agendamentos futuros:', {
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
