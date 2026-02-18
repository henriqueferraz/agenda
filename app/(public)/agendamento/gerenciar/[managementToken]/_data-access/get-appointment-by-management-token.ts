/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca um agendamento pelo managementToken (F-08).
 * Rota pública (sem JWT) — o token serve como autenticação implícita.
 * Retorna dados completos (serviço, funcionário, empresa, endereço) para
 * a página de autogestão do cliente.
 *
 * @example
 * const result = await getAppointmentByManagementToken({ managementToken: 'abc123def456' })
 * if (result) console.log(result.appointment.name, result.appointment.status)
 */
import prisma from '@/lib/prisma'
import { getNowInSaoPaulo } from '@/utils/date-timezone'

/** Dados do agendamento com relações para exibição na página de gerenciamento. */
export interface ManagementAppointmentData {
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
	/** Horário do agendamento (HH:MM). */
	time: string
	/** Status do agendamento. */
	status: 'confirmed' | 'cancelled'
	/** Token de gerenciamento. */
	managementToken: string
	/** ID do usuário (empresa). */
	userId: string
	/** Serviço vinculado. */
	service: {
		id: string
		name: string
		price: number
		duration: number
	}
	/** Funcionário vinculado. */
	employee: {
		id: string
		name: string
		phone: string
	}
	/** Empresa (profissional). */
	user: {
		id: string
		name: string | null
		be_called: string | null
		phone: string | null
		email: string
		token_called: string | null
	}
	/** Endereço da empresa. */
	address: {
		street: string | null
		number: string | null
		complement: string | null
		neighborhood: string | null
		city: string | null
		state: string | null
		zip_code: string | null
	} | null
}

/** Resultado da busca por managementToken. */
export interface ManagementTokenResult {
	/** Dados do agendamento ou null se inválido. */
	appointment: ManagementAppointmentData | null
	/** Motivo de erro quando appointment é null. */
	error?: 'not_found' | 'cancelled' | 'expired'
}

/**
 * Busca um agendamento pelo managementToken para autogestão do cliente (F-08).
 * Valida existência, status (não cancelado) e se o agendamento é futuro.
 *
 * @param params - managementToken do agendamento
 * @returns ManagementTokenResult com dados ou motivo de erro
 *
 * @example
 * ```typescript
 * const result = await getAppointmentByManagementToken({
 *   managementToken: '3a7f2c...',
 * })
 * if (result.appointment) {
 *   console.log(result.appointment.service.name)
 * } else {
 *   console.log(result.error) // 'not_found' | 'cancelled' | 'expired'
 * }
 * ```
 */
export const getAppointmentByManagementToken = async ({
	managementToken,
}: {
	managementToken: string
}): Promise<ManagementTokenResult> => {
	try {
		if (!managementToken || managementToken.length < 10) {
			return { appointment: null, error: 'not_found' }
		}

		const appointment = await prisma.appointment.findUnique({
			where: { managementToken },
			include: {
				service: {
					select: { id: true, name: true, price: true, duration: true },
				},
				employee: {
					select: { id: true, name: true, phone: true },
				},
				user: {
					select: {
						id: true,
						name: true,
						be_called: true,
						phone: true,
						email: true,
						token_called: true,
					},
				},
			},
		})

		if (!appointment) {
			return { appointment: null, error: 'not_found' }
		}

		if (appointment.status === 'cancelled') {
			return { appointment: null, error: 'cancelled' }
		}

		const now = getNowInSaoPaulo()
		const [hours, minutes] = appointment.time.split(':').map(Number)
		const appointmentEnd = new Date(appointment.appointmentDate)
		appointmentEnd.setHours(hours, minutes, 0, 0)
		appointmentEnd.setMinutes(
			appointmentEnd.getMinutes() + appointment.service.duration,
		)

		if (appointmentEnd < now) {
			return { appointment: null, error: 'expired' }
		}

		const address = await prisma.address.findUnique({
			where: { UserId: appointment.userId },
			select: {
				street: true,
				number: true,
				complement: true,
				neighborhood: true,
				city: true,
				state: true,
				zip_code: true,
			},
		})

		return {
			appointment: {
				id: appointment.id,
				name: appointment.name,
				email: appointment.email,
				phone: appointment.phone,
				appointmentDate: appointment.appointmentDate,
				time: appointment.time,
				status: appointment.status as 'confirmed' | 'cancelled',
				managementToken: appointment.managementToken!,
				userId: appointment.userId,
				service: appointment.service,
				employee: appointment.employee,
				user: appointment.user,
				address,
			},
		}
	} catch (error) {
		console.error('Erro ao buscar agendamento por managementToken:', {
			error: error instanceof Error ? error.message : error,
		})
		return { appointment: null, error: 'not_found' }
	}
}
