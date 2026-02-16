/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca um agendamento por ID com serviço, funcionário e histórico de alterações.
 * Valida autenticação e propriedade (userId). Usado pelo modal de detalhes (F-02).
 *
 * @example
 * const appointment = await getAppointmentById({ appointmentId: 'apt_1', userId: 'usr_1' })
 */
'use server'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

/** Props para busca de agendamento por ID. */
interface GetAppointmentByIdProps {
	/** ID do agendamento. */
	appointmentId: string
	/** ID do usuário (empresa) dono do agendamento. */
	userId: string
}

/**
 * Busca um agendamento pelo ID com dados completos (serviço, funcionário, histórico).
 * Valida autenticação via JWT e propriedade do recurso.
 *
 * @param props - appointmentId e userId
 * @returns Agendamento completo ou null se não encontrado/não autorizado
 *
 * @example
 * ```typescript
 * const appointment = await getAppointmentById({
 *   appointmentId: 'apt_123',
 *   userId: 'usr_456',
 * })
 * if (appointment) {
 *   console.log(appointment.name, appointment.status)
 *   console.log(appointment.history.length, 'alterações')
 * }
 * ```
 */
export const getAppointmentById = async ({
	appointmentId,
	userId,
}: GetAppointmentByIdProps) => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return null
		}

		if (session.id !== userId) {
			return null
		}

		if (!appointmentId) {
			return null
		}

		const appointment = await prisma.appointment.findFirst({
			where: {
				id: appointmentId,
				userId,
			},
			include: {
				service: true,
				employee: true,
				history: {
					orderBy: { createdAt: 'desc' },
				},
			},
		})

		return appointment
	} catch (error) {
		console.error('Erro ao buscar agendamento por ID:', {
			appointmentId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
