/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca agendamentos confirmados do usuário em um período.
 * Retorna com service e employee para exibição nos dialogs de envio em massa (F-07).
 *
 * @example
 * const appointments = await getAppointmentsByPeriod({ userId: 'usr_1', startDate: '2026-02-20', endDate: '2026-02-25' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { startOfDayInSaoPaulo, endOfDayInSaoPaulo } from '@/utils/date-timezone'

/** Formato de um agendamento retornado pela busca por período. */
export interface PeriodAppointment {
	/** ID do agendamento. */
	id: string
	/** Nome do cliente. */
	name: string
	/** Email do cliente. */
	email: string
	/** Telefone do cliente. */
	phone: string
	/** Data do agendamento. */
	appointmentDate: Date
	/** Horário no formato HH:mm. */
	time: string
	/** Token de gerenciamento do cliente (F-08). */
	managementToken: string | null
	/** Serviço vinculado. */
	service: {
		/** ID do serviço. */
		id: string
		/** Nome do serviço. */
		name: string
		/** Preço em centavos. */
		price: number
		/** Duração em minutos. */
		duration: number
	}
	/** Funcionário vinculado. */
	employee: {
		/** ID do funcionário. */
		id: string
		/** Nome do funcionário. */
		name: string
	}
}

/**
 * Busca agendamentos confirmados em um período para o usuário autenticado.
 *
 * @param params - userId, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 * @returns Lista de agendamentos com service e employee, ordenados por data e hora
 *
 * @example
 * ```typescript
 * const list = await getAppointmentsByPeriod({
 *   userId: 'usr_1',
 *   startDate: '2026-02-20',
 *   endDate: '2026-02-25',
 * })
 * // list[0].name → 'Maria Silva'
 * ```
 */
export const getAppointmentsByPeriod = async ({
	userId,
	startDate,
	endDate,
}: {
	userId: string
	startDate: string
	endDate: string
}): Promise<PeriodAppointment[]> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) {
			return []
		}

		const start = startOfDayInSaoPaulo(new Date(startDate + 'T12:00:00Z'))
		const end = endOfDayInSaoPaulo(new Date(endDate + 'T12:00:00Z'))

		const appointments = await prisma.appointment.findMany({
			where: {
				userId,
				status: 'confirmed',
				appointmentDate: { gte: start, lte: end },
			},
			include: {
				service: { select: { id: true, name: true, price: true, duration: true } },
				employee: { select: { id: true, name: true } },
				client: true,
			},
			orderBy: [{ appointmentDate: 'asc' }, { time: 'asc' }],
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
		console.error('Erro ao buscar agendamentos por período:', {
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
