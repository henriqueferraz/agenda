/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Server action pública para cancelamento de agendamento pelo cliente (F-08).
 * Valida managementToken, verifica status e prazo mínimo, usa cancelAppointmentCore
 * para executar o cancelamento atômico e notifica o profissional via rota global.
 *
 * @example
 * import { cancelAppointmentPublic } from './_actions/cancel-appointment-public'
 * const result = await cancelAppointmentPublic({ managementToken: 'abc123', reason: 'Não poderei comparecer' })
 */
'use server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cancelAppointmentCore } from '@/app/_core/appointment-core'
import { sendGlobalMessage } from '@/lib/global-messaging'
import { getNowInSaoPaulo, getDateComponentsInSaoPaulo, createDateInSaoPaulo } from '@/utils/date-timezone'

/** Prazo mínimo padrão para cancelamento pelo cliente (em horas). */
const MIN_CANCEL_HOURS = 2

/** Schema de validação para cancelamento público. */
const cancelPublicSchema = z.object({
	managementToken: z.string().min(10, 'Token inválido'),
	reason: z.string().max(500, 'Motivo muito longo').optional(),
})

/** Resposta padronizada da server action. */
interface ActionResponse {
	/** Indica se a operação foi bem-sucedida. */
	success: boolean
	/** Mensagem de erro. */
	error?: string
	/** Mensagem de sucesso. */
	message?: string
}

/**
 * Cancela um agendamento pelo cliente via managementToken (F-08).
 * Fluxo: valida token → verifica prazo mínimo → cancelAppointmentCore → notifica profissional.
 *
 * @param data - managementToken e motivo opcional
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await cancelAppointmentPublic({
 *   managementToken: '3a7f2c...',
 *   reason: 'Não poderei comparecer ao agendamento',
 * })
 * if (result.success) {
 *   console.log('Cancelado com sucesso')
 * }
 * ```
 */
export const cancelAppointmentPublic = async (
	data: { managementToken: string; reason?: string },
): Promise<ActionResponse> => {
	try {
		const validated = cancelPublicSchema.parse(data)

		const appointment = await prisma.appointment.findUnique({
			where: { managementToken: validated.managementToken },
			include: {
				service: true,
				employee: true,
				client: true,
				user: {
					select: {
						id: true,
						name: true,
						phone: true,
						email: true,
						be_called: true,
						token_called: true,
					},
				},
			},
		})

		if (!appointment) {
			return { success: false, error: 'Agendamento não encontrado.' }
		}

		if (appointment.status === 'cancelled') {
			return { success: false, error: 'Este agendamento já foi cancelado.' }
		}

		const now = getNowInSaoPaulo()
		const dateComponents = getDateComponentsInSaoPaulo(appointment.appointmentDate)
		const [hours, minutes] = appointment.time.split(':').map(Number)
		const appointmentDateTime = createDateInSaoPaulo(
			dateComponents.year,
			dateComponents.month,
			dateComponents.day,
			hours,
			minutes,
			0,
			0,
		)

		const hoursUntilAppointment =
			(appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

		if (hoursUntilAppointment < MIN_CANCEL_HOURS) {
			return {
				success: false,
				error: `Não é possível cancelar com menos de ${MIN_CANCEL_HOURS} horas de antecedência.`,
			}
		}

		const result = await cancelAppointmentCore({
			appointmentId: appointment.id,
			reason: validated.reason,
			cancelledBy: 'client',
			userId: appointment.userId,
		})

		if (!result.success) {
			return { success: false, error: result.error }
		}

		const dateStr = appointment.appointmentDate.toISOString().split('T')[0]

		sendGlobalMessage({
			type: 'client_cancelled',
			userId: appointment.userId,
			channel: 'whatsapp',
			clientName: appointment.client.name,
			clientPhone: appointment.client.phone,
			clientEmail: appointment.client.email,
			appointmentDate: dateStr,
			appointmentTime: appointment.time,
			serviceName: appointment.service.name,
			servicePrice: String(appointment.service.price),
			serviceDuration: String(appointment.service.duration),
			employeeName: appointment.employee.name,
			reason: validated.reason ?? '',
			professionalName: appointment.user.be_called ?? appointment.user.name ?? '',
			message: `O cliente ${appointment.client.name} cancelou o agendamento de ${appointment.service.name} do dia ${dateStr} às ${appointment.time}.${validated.reason ? ` Motivo: ${validated.reason}` : ''}`,
		}).catch(() => {})

		revalidatePath('/dashboard/schedule/calendar')

		return {
			success: true,
			message: 'Agendamento cancelado com sucesso.',
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0]?.message ?? 'Dados inválidos' }
		}
		console.error('Erro ao cancelar agendamento público:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
	}
}
