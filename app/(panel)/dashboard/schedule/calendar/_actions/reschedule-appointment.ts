/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que reagenda um agendamento pelo profissional no painel.
 * Valida autenticação, chama rescheduleAppointmentCore com validação F-01,
 * notifica via webhook N8N e revalida o cache do calendário.
 *
 * @example
 * import { rescheduleAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/reschedule-appointment'
 * const result = await rescheduleAppointment({ appointmentId: 'apt_1', newDate: new Date('2026-02-20'), newTime: '14:00' })
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getUserFromToken } from '@/lib/auth'
import { rescheduleAppointmentCore } from '@/app/_core/appointment-core'
import { sendAppointmentWebhook } from '@/lib/webhook-notify'
import prisma from '@/lib/prisma'
import { getDateComponentsInSaoPaulo } from '@/utils/date-timezone'

/** Schema de validação para reagendamento. */
const rescheduleAppointmentSchema = z.object({
	appointmentId: z.string().min(1, 'ID do agendamento é obrigatório'),
	newDate: z.date(),
	newTime: z
		.string()
		.regex(
			/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
			'Horário deve estar no formato HH:MM',
		),
	reason: z
		.string()
		.min(1, 'Motivo do reagendamento é obrigatório')
		.max(500, 'Motivo deve ter no máximo 500 caracteres'),
})

/** Dados de entrada para reagendamento. */
type RescheduleAppointmentData = z.infer<typeof rescheduleAppointmentSchema>

/** Resposta padronizada da action. */
interface ActionResponse {
	/** Indica se a operação foi bem-sucedida. */
	success: boolean
	/** Mensagem de sucesso. */
	message?: string
	/** Mensagem de erro. */
	error?: string
}

/**
 * Reagenda um agendamento para nova data/hora pelo profissional autenticado.
 * Valida sessão JWT, dados de entrada via Zod e delega para rescheduleAppointmentCore.
 * O core valida conflitos F-01 (funcionário e cliente) excluindo o próprio agendamento.
 *
 * @param data - appointmentId, newDate, newTime e reason (motivo obrigatório)
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await rescheduleAppointment({
 *   appointmentId: 'apt_123',
 *   newDate: new Date('2026-02-20'),
 *   newTime: '15:30',
 *   reason: 'Cliente solicitou novo horário',
 * })
 * if (result.success) console.log(result.message)
 * ```
 */
export const rescheduleAppointment = async (
	data: RescheduleAppointmentData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}

		const validatedData = rescheduleAppointmentSchema.parse(data)

		const original = await prisma.appointment.findFirst({
			where: { id: validatedData.appointmentId, userId: session.id },
			select: { appointmentDate: true, time: true },
		})

		const result = await rescheduleAppointmentCore({
			appointmentId: validatedData.appointmentId,
			newDate: validatedData.newDate,
			newTime: validatedData.newTime,
			performedBy: 'professional',
			userId: session.id,
		})

		if (!result.success) {
			return { success: false, error: result.error }
		}

		revalidatePath('/dashboard/schedule/calendar')

		if (result.data && original) {
			const oldComponents = getDateComponentsInSaoPaulo(original.appointmentDate)
			const oldDateStr = `${oldComponents.year}-${String(oldComponents.month + 1).padStart(2, '0')}-${String(oldComponents.day).padStart(2, '0')}`

			sendAppointmentWebhook({
				type: 'reschedule',
				appointment: result.data as unknown as Parameters<typeof sendAppointmentWebhook>[0]['appointment'],
				userId: session.id,
				oldDate: oldDateStr,
				oldTime: original.time,
				changeReason: validatedData.reason,
			}).catch((err) => {
				console.error('[RESCHEDULE] Erro não tratado no webhook:', {
					error: err instanceof Error ? err.message : 'Erro desconhecido',
				})
			})
		}

		return {
			success: true,
			message: 'Agendamento reagendado com sucesso.',
		}
	} catch (error) {
		console.error('Erro ao reagendar agendamento:', {
			appointmentId: data.appointmentId,
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})

		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || 'Dados inválidos',
			}
		}

		return {
			success: false,
			error: 'Erro ao reagendar agendamento. Tente novamente.',
		}
	}
}
