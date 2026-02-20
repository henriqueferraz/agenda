/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Server action pública para reagendamento pelo cliente (F-08).
 * Valida managementToken, prazo mínimo, nova data/hora; usa rescheduleAppointmentCore
 * para executar a alteração atômica com verificação de conflitos (F-01).
 * Notifica o profissional via rota global N8N.
 *
 * @example
 * import { rescheduleAppointmentPublic } from './_actions/reschedule-appointment-public'
 * const result = await rescheduleAppointmentPublic({
 *   managementToken: 'abc123',
 *   newDate: new Date('2026-02-25'),
 *   newTime: '14:00',
 * })
 */
'use server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { rescheduleAppointmentCore } from '@/app/_core/appointment-core'
import { sendGlobalMessage } from '@/lib/global-messaging'
import { getNowInSaoPaulo, getDateComponentsInSaoPaulo, createDateInSaoPaulo } from '@/utils/date-timezone'

/** Prazo mínimo padrão para reagendamento pelo cliente (em horas). */
const MIN_RESCHEDULE_HOURS = 2

/** Schema de validação para reagendamento público. */
const reschedulePublicSchema = z.object({
	managementToken: z.string().min(10, 'Token inválido'),
	newDate: z.date(),
	newTime: z.string().regex(
		/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
		'Horário deve estar no formato HH:MM',
	),
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
 * Reagenda um agendamento pelo cliente via managementToken (F-08).
 * Fluxo: valida token → verifica prazo → rescheduleAppointmentCore (conflitos F-01) → notifica profissional.
 *
 * @param data - managementToken, nova data e novo horário
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await rescheduleAppointmentPublic({
 *   managementToken: '3a7f2c...',
 *   newDate: new Date('2026-02-25'),
 *   newTime: '14:00',
 * })
 * if (result.success) {
 *   console.log(result.message)
 * }
 * ```
 */
export const rescheduleAppointmentPublic = async (
	data: { managementToken: string; newDate: Date; newTime: string },
): Promise<ActionResponse> => {
	try {
		const validated = reschedulePublicSchema.parse(data)

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
			return { success: false, error: 'Não é possível reagendar um agendamento cancelado.' }
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

		if (hoursUntilAppointment < MIN_RESCHEDULE_HOURS) {
			return {
				success: false,
				error: `Não é possível reagendar com menos de ${MIN_RESCHEDULE_HOURS} horas de antecedência.`,
			}
		}

		const oldDate = appointment.appointmentDate.toISOString().split('T')[0]
		const oldTime = appointment.time

		const result = await rescheduleAppointmentCore({
			appointmentId: appointment.id,
			newDate: validated.newDate,
			newTime: validated.newTime,
			performedBy: 'client',
			userId: appointment.userId,
		})

		if (!result.success) {
			return { success: false, error: result.error }
		}

		const newDateStr = validated.newDate.toISOString().split('T')[0]

		sendGlobalMessage({
			type: 'client_rescheduled',
			userId: appointment.userId,
			channel: 'whatsapp',
			clientName: appointment.client.name,
			clientPhone: appointment.client.phone,
			clientEmail: appointment.client.email,
			appointmentDate: newDateStr,
			appointmentTime: validated.newTime,
			serviceName: appointment.service.name,
			servicePrice: String(appointment.service.price),
			serviceDuration: String(appointment.service.duration),
			employeeName: appointment.employee.name,
			oldDate,
			oldTime,
			newDate: newDateStr,
			newTime: validated.newTime,
			professionalName: appointment.user.be_called ?? appointment.user.name ?? '',
			message: `O cliente ${appointment.client.name} reagendou o ${appointment.service.name} de ${oldDate} às ${oldTime} para ${newDateStr} às ${validated.newTime}.`,
		}).catch(() => {})

		revalidatePath('/dashboard/schedule/calendar')

		return {
			success: true,
			message: `Agendamento remarcado para ${newDateStr} às ${validated.newTime}.`,
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0]?.message ?? 'Dados inválidos' }
		}
		console.error('Erro ao reagendar agendamento público:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return { success: false, error: 'Erro ao reagendar. Tente novamente.' }
	}
}
