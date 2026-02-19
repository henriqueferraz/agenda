/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * Server action que envia uma mensagem individual via WhatsApp para um cliente
 * a partir de um agendamento selecionado (F-07).
 * Valida autenticação, busca o agendamento, envia via sendGlobalMessage
 * e registra no MessageLog.
 *
 * @example
 * import { sendIndividualMessage } from './_actions/send-individual-message'
 * const result = await sendIndividualMessage({ appointmentId: 'apt_1', message: 'Olá Maria!' })
 */
'use server'
import { z } from 'zod'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendGlobalMessage } from '@/lib/global-messaging'
import { getDateComponentsInSaoPaulo } from '@/utils/date-timezone'

/** Schema de validação para mensagem individual. */
const sendIndividualSchema = z.object({
	appointmentId: z.string().min(1, 'ID do agendamento é obrigatório'),
	message: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem deve ter no máximo 2000 caracteres'),
})

/** Dados de entrada para envio individual. */
type SendIndividualData = z.infer<typeof sendIndividualSchema>

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
 * Envia mensagem WhatsApp individual para o cliente de um agendamento.
 *
 * @param data - appointmentId e message (texto editado pelo profissional)
 * @returns ActionResponse com sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await sendIndividualMessage({
 *   appointmentId: 'apt_123',
 *   message: 'Olá Maria! Sobre seu agendamento...',
 * })
 * if (result.success) console.log(result.message)
 * ```
 */
export const sendIndividualMessage = async (
	data: SendIndividualData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return { success: false, error: 'Não autenticado. Faça login para continuar.' }
		}

		const validated = sendIndividualSchema.parse(data)

		const appointment = await prisma.appointment.findFirst({
			where: { id: validated.appointmentId, userId: session.id },
			include: {
				service: { select: { name: true, price: true, duration: true } },
				employee: { select: { name: true } },
			},
		})

		if (!appointment) {
			return { success: false, error: 'Agendamento não encontrado.' }
		}

		const dateComp = getDateComponentsInSaoPaulo(appointment.appointmentDate)
		const dateStr = `${dateComp.year}-${String(dateComp.month + 1).padStart(2, '0')}-${String(dateComp.day).padStart(2, '0')}`

		await sendGlobalMessage({
			type: 'custom_individual',
			userId: session.id,
			channel: 'whatsapp',
			clientName: appointment.name,
			clientPhone: appointment.phone,
			clientEmail: appointment.email,
			appointmentDate: dateStr,
			appointmentTime: appointment.time,
			serviceName: appointment.service.name,
			servicePrice: String(appointment.service.price),
			serviceDuration: String(appointment.service.duration),
			employeeName: appointment.employee.name,
			managementLink: appointment.managementToken
				? `${process.env.NEXT_PUBLIC_APP_URL || ''}/agendamento/gerenciar/${appointment.managementToken}`
				: '',
			message: validated.message,
		})

		await prisma.messageLog.create({
			data: {
				userId: session.id,
				type: 'custom_individual',
				recipientName: appointment.name,
				recipientPhone: appointment.phone,
				recipientEmail: appointment.email,
				appointmentId: appointment.id,
				message: validated.message,
				status: 'sent',
			},
		})

		return { success: true, message: `Mensagem enviada para ${appointment.name}.` }
	} catch (error) {
		console.error('Erro ao enviar mensagem individual:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})

		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0]?.message || 'Dados inválidos' }
		}

		return { success: false, error: 'Erro ao enviar mensagem. Tente novamente.' }
	}
}
