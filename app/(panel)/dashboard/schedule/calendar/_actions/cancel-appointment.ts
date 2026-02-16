/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que cancela um agendamento pelo profissional no painel.
 * Valida autenticação, chama cancelAppointmentCore e revalida o cache do calendário.
 *
 * @example
 * import { cancelAppointment } from '@/app/(panel)/dashboard/schedule/calendar/_actions/cancel-appointment'
 * const result = await cancelAppointment({ appointmentId: 'apt_1', reason: 'Cliente não compareceu' })
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getUserFromToken } from '@/lib/auth'
import { cancelAppointmentCore } from '@/app/_core/appointment-core'

/** Schema de validação para cancelamento de agendamento. */
const cancelAppointmentSchema = z.object({
	appointmentId: z.string().min(1, 'ID do agendamento é obrigatório'),
	reason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
})

/** Dados de entrada para cancelamento. */
type CancelAppointmentData = z.infer<typeof cancelAppointmentSchema>

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
 * Cancela um agendamento pelo profissional autenticado.
 * Valida sessão JWT, dados de entrada via Zod e delega para cancelAppointmentCore.
 *
 * @param data - appointmentId e reason (opcional)
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await cancelAppointment({
 *   appointmentId: 'apt_123',
 *   reason: 'Cliente solicitou cancelamento',
 * })
 * if (result.success) console.log(result.message)
 * ```
 */
export const cancelAppointment = async (
	data: CancelAppointmentData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}

		const validatedData = cancelAppointmentSchema.parse(data)

		const result = await cancelAppointmentCore({
			appointmentId: validatedData.appointmentId,
			reason: validatedData.reason,
			cancelledBy: 'professional',
			userId: session.id,
		})

		if (!result.success) {
			return { success: false, error: result.error }
		}

		revalidatePath('/dashboard/schedule/calendar')

		return {
			success: true,
			message: 'Agendamento cancelado com sucesso.',
		}
	} catch (error) {
		console.error('Erro ao cancelar agendamento:', {
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
			error: 'Erro ao cancelar agendamento. Tente novamente.',
		}
	}
}
