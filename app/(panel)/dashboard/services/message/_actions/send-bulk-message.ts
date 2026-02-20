/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Server action que envia mensagem em massa via WhatsApp para clientes selecionados (F-07).
 * Recebe IDs de agendamentos selecionados, agrupa por telefone único para evitar
 * duplicatas, envia via sendGlobalMessage e registra cada envio no MessageLog.
 *
 * @example
 * import { sendBulkMessage } from './_actions/send-bulk-message'
 * const result = await sendBulkMessage({ appointmentIds: ['apt_1', 'apt_2'], message: 'Aviso importante!' })
 */
'use server'
import { z } from 'zod'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendGlobalMessage } from '@/lib/global-messaging'
import { getDateComponentsInSaoPaulo } from '@/utils/date-timezone'

/** Schema de validação para mensagem em massa. */
const sendBulkSchema = z.object({
	appointmentIds: z.array(z.string().min(1)).min(1, 'Selecione pelo menos um cliente'),
	message: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem deve ter no máximo 2000 caracteres'),
})

/** Dados de entrada para envio em massa. */
type SendBulkData = z.infer<typeof sendBulkSchema>

/** Resposta padronizada da action com contadores. */
interface BulkActionResponse {
	/** Indica se a operação foi bem-sucedida. */
	success: boolean
	/** Mensagem de sucesso. */
	message?: string
	/** Mensagem de erro. */
	error?: string
	/** Quantidade de mensagens enviadas. */
	sent?: number
	/** Total de clientes únicos encontrados. */
	total?: number
}

/**
 * Envia mensagem WhatsApp em massa para os clientes dos agendamentos selecionados.
 * Agrupa por telefone para evitar envio duplicado ao mesmo cliente.
 *
 * @param data - appointmentIds (IDs selecionados) e message (texto editado)
 * @returns BulkActionResponse com contadores de envio
 *
 * @example
 * ```typescript
 * const result = await sendBulkMessage({
 *   appointmentIds: ['apt_1', 'apt_2', 'apt_3'],
 *   message: 'Informamos que haverá mudança de horário...',
 * })
 * if (result.success) console.log(`Enviadas: ${result.sent}/${result.total}`)
 * ```
 */
export const sendBulkMessage = async (
	data: SendBulkData,
): Promise<BulkActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return { success: false, error: 'Não autenticado. Faça login para continuar.' }
		}

		const validated = sendBulkSchema.parse(data)

		const appointments = await prisma.appointment.findMany({
			where: {
				id: { in: validated.appointmentIds },
				userId: session.id,
			},
			include: {
				service: { select: { name: true, price: true, duration: true } },
				employee: { select: { name: true } },
				client: true,
			},
		})

		if (appointments.length === 0) {
			return { success: false, error: 'Nenhum agendamento encontrado.' }
		}

		const uniqueByPhone = new Map<string, typeof appointments[0]>()
		for (const apt of appointments) {
			if (!uniqueByPhone.has(apt.client.phone)) {
				uniqueByPhone.set(apt.client.phone, apt)
			}
		}

		let sent = 0
		for (const [, apt] of uniqueByPhone) {
			const dateComp = getDateComponentsInSaoPaulo(apt.appointmentDate)
			const dateStr = `${dateComp.year}-${String(dateComp.month + 1).padStart(2, '0')}-${String(dateComp.day).padStart(2, '0')}`

			await sendGlobalMessage({
				type: 'custom_bulk',
				userId: session.id,
				channel: 'whatsapp',
				clientName: apt.client.name,
				clientPhone: apt.client.phone,
				clientEmail: apt.client.email,
				appointmentDate: dateStr,
				appointmentTime: apt.time,
				serviceName: apt.service.name,
				servicePrice: String(apt.service.price),
				serviceDuration: String(apt.service.duration),
				employeeName: apt.employee.name,
				managementLink: apt.managementToken
					? `${process.env.NEXT_PUBLIC_APP_URL || ''}/agendamento/gerenciar/${apt.managementToken}`
					: '',
				message: validated.message,
			})

			await prisma.messageLog.create({
				data: {
					userId: session.id,
					type: 'custom_bulk',
					recipientName: apt.client.name,
					recipientPhone: apt.client.phone,
					recipientEmail: apt.client.email,
					appointmentId: apt.id,
					message: validated.message,
					status: 'sent',
				},
			})

			sent++
		}

		return {
			success: true,
			message: `Mensagem enviada para ${sent} cliente${sent !== 1 ? 's' : ''}.`,
			sent,
			total: uniqueByPhone.size,
		}
	} catch (error) {
		console.error('Erro ao enviar mensagem em massa:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})

		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0]?.message || 'Dados inválidos' }
		}

		return { success: false, error: 'Erro ao enviar mensagens. Tente novamente.' }
	}
}
