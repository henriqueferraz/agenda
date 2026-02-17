/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que edita um agendamento pelo profissional no painel.
 * Permite alterar serviço, funcionário, data e horário. Valida autenticação,
 * chama updateAppointmentCore com validação F-01, notifica via webhook N8N
 * e revalida o cache do calendário.
 *
 * @example
 * import { updateAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/update-appointment'
 * const result = await updateAppointment({ appointmentId: 'apt_1', serviceId: 'srv_2', time: '15:00' })
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getUserFromToken } from '@/lib/auth'
import { updateAppointmentCore } from '@/app/_core/appointment-core'
import { sendAppointmentWebhook } from '@/lib/webhook-notify'
import prisma from '@/lib/prisma'
import { getDateComponentsInSaoPaulo } from '@/utils/date-timezone'

/** Schema de validação para edição de agendamento. */
const updateAppointmentSchema = z.object({
	appointmentId: z.string().min(1, 'ID do agendamento é obrigatório'),
	serviceId: z.string().min(1).optional(),
	employeeId: z.string().min(1).optional(),
	appointmentDate: z.date().optional(),
	time: z
		.string()
		.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido')
		.optional(),
	reason: z
		.string()
		.min(1, 'Motivo da alteração é obrigatório')
		.max(500, 'Motivo deve ter no máximo 500 caracteres'),
})

/** Dados de entrada para edição. */
type UpdateAppointmentData = z.infer<typeof updateAppointmentSchema>

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
 * Edita um agendamento existente pelo profissional autenticado.
 * Valida sessão JWT, dados de entrada via Zod e delega para updateAppointmentCore.
 * O core valida existência de serviço/funcionário, conflitos F-01 e registra alterações.
 *
 * @param data - appointmentId, reason (obrigatório) e campos opcionais: serviceId, employeeId, appointmentDate, time
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await updateAppointment({
 *   appointmentId: 'apt_123',
 *   reason: 'Troca de profissional solicitada',
 *   serviceId: 'srv_456',
 *   employeeId: 'emp_789',
 *   appointmentDate: new Date('2026-02-20'),
 *   time: '16:00',
 * })
 * if (result.success) console.log(result.message)
 * ```
 */
export const updateAppointment = async (
	data: UpdateAppointmentData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}

		const validatedData = updateAppointmentSchema.parse(data)

		// Captura dados originais para enviar no webhook
		const original = await prisma.appointment.findFirst({
			where: { id: validatedData.appointmentId, userId: session.id },
			select: { appointmentDate: true, time: true },
		})

		const result = await updateAppointmentCore({
			appointmentId: validatedData.appointmentId,
			data: {
				serviceId: validatedData.serviceId,
				employeeId: validatedData.employeeId,
				appointmentDate: validatedData.appointmentDate,
				time: validatedData.time,
			},
			performedBy: 'professional',
			userId: session.id,
		})

		if (!result.success) {
			return { success: false, error: result.error }
		}

		revalidatePath('/dashboard/schedule/calendar')

		if (result.data) {
			const webhookParams: Parameters<typeof sendAppointmentWebhook>[0] = {
				type: 'edit',
				appointment: result.data as unknown as Parameters<typeof sendAppointmentWebhook>[0]['appointment'],
				userId: session.id,
				changeReason: validatedData.reason,
			}

			if (original) {
				const oldComponents = getDateComponentsInSaoPaulo(original.appointmentDate)
				webhookParams.oldDate = `${oldComponents.year}-${String(oldComponents.month + 1).padStart(2, '0')}-${String(oldComponents.day).padStart(2, '0')}`
				webhookParams.oldTime = original.time
			}

			sendAppointmentWebhook(webhookParams).catch((err) => {
				console.error('[UPDATE] Erro não tratado no webhook:', {
					error: err instanceof Error ? err.message : 'Erro desconhecido',
				})
			})
		}

		return {
			success: true,
			message: 'Agendamento atualizado com sucesso.',
		}
	} catch (error) {
		console.error('Erro ao atualizar agendamento:', {
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
			error: 'Erro ao atualizar agendamento. Tente novamente.',
		}
	}
}
