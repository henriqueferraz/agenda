/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Server action que notifica clientes sobre indisponibilidade do profissional (F-07).
 * Recebe IDs de agendamentos selecionados, opcionalmente cancela-os via cancelAppointmentCore,
 * envia notificação via sendGlobalMessage e registra cada envio no MessageLog.
 *
 * @example
 * import { notifyUnavailability } from './_actions/notify-unavailability'
 * const result = await notifyUnavailability({
 *   appointmentIds: ['apt_1', 'apt_2'],
 *   reason: 'Indisposição médica',
 *   message: 'Olá! Infelizmente precisamos cancelar...',
 *   cancelAppointments: true,
 * })
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendGlobalMessage } from '@/lib/global-messaging'
import { cancelAppointmentCore } from '@/app/_core/appointment-core'
import { getDateComponentsInSaoPaulo } from '@/utils/date-timezone'

/** Schema de validação para notificação de indisponibilidade. */
const notifyUnavailabilitySchema = z.object({
	appointmentIds: z.array(z.string().min(1)).min(1, 'Selecione pelo menos um agendamento'),
	reason: z.string().min(1, 'Informe o motivo da indisponibilidade').max(500, 'Motivo deve ter no máximo 500 caracteres'),
	message: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem deve ter no máximo 2000 caracteres'),
	cancelAppointments: z.boolean(),
})

/** Dados de entrada para notificação de indisponibilidade. */
type NotifyUnavailabilityData = z.infer<typeof notifyUnavailabilitySchema>

/** Resposta padronizada da action com contadores. */
interface UnavailabilityResponse {
	/** Indica se a operação foi bem-sucedida. */
	success: boolean
	/** Mensagem de sucesso. */
	message?: string
	/** Mensagem de erro. */
	error?: string
	/** Quantidade de notificações enviadas. */
	sent?: number
	/** Quantidade de agendamentos cancelados. */
	cancelled?: number
}

/**
 * Notifica clientes sobre indisponibilidade e opcionalmente cancela os agendamentos.
 * Usa cancelAppointmentCore do F-02 para cancelamentos e sendGlobalMessage para notificações.
 *
 * @param data - appointmentIds, reason, message, cancelAppointments
 * @returns UnavailabilityResponse com contadores
 *
 * @example
 * ```typescript
 * const result = await notifyUnavailability({
 *   appointmentIds: ['apt_1', 'apt_2'],
 *   reason: 'Indisposição médica',
 *   message: 'Olá! Precisamos cancelar seu agendamento...',
 *   cancelAppointments: true,
 * })
 * if (result.success) console.log(`Enviadas: ${result.sent}, Cancelados: ${result.cancelled}`)
 * ```
 */
export const notifyUnavailability = async (
	data: NotifyUnavailabilityData,
): Promise<UnavailabilityResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return { success: false, error: 'Não autenticado. Faça login para continuar.' }
		}

		const validated = notifyUnavailabilitySchema.parse(data)

		const appointments = await prisma.appointment.findMany({
			where: {
				id: { in: validated.appointmentIds },
				userId: session.id,
				status: 'confirmed',
			},
			include: {
				service: { select: { name: true, price: true, duration: true } },
				employee: { select: { name: true } },
				client: true,
			},
		})

		if (appointments.length === 0) {
			return { success: false, error: 'Nenhum agendamento confirmado encontrado.' }
		}

		let cancelled = 0
		if (validated.cancelAppointments) {
			for (const apt of appointments) {
				const result = await cancelAppointmentCore({
					appointmentId: apt.id,
					reason: validated.reason,
					cancelledBy: 'professional',
					userId: session.id,
				})
				if (result.success) cancelled++
			}
		}

		let sent = 0
		const uniqueByPhone = new Map<string, typeof appointments[0]>()
		for (const apt of appointments) {
			if (!uniqueByPhone.has(apt.client.phone)) {
				uniqueByPhone.set(apt.client.phone, apt)
			}
		}

		for (const [, apt] of uniqueByPhone) {
			const dateComp = getDateComponentsInSaoPaulo(apt.appointmentDate)
			const dateStr = `${dateComp.year}-${String(dateComp.month + 1).padStart(2, '0')}-${String(dateComp.day).padStart(2, '0')}`

			await sendGlobalMessage({
				type: 'unavailability',
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
				reason: validated.reason,
				managementLink: apt.managementToken
					? `${process.env.NEXT_PUBLIC_APP_URL || ''}/agendamento/gerenciar/${apt.managementToken}`
					: '',
				message: validated.message,
			})

			await prisma.messageLog.create({
				data: {
					userId: session.id,
					type: 'unavailability',
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

		revalidatePath('/dashboard/schedule/calendar')

		const parts: string[] = []
		parts.push(`${sent} cliente${sent !== 1 ? 's' : ''} notificado${sent !== 1 ? 's' : ''}`)
		if (validated.cancelAppointments) {
			parts.push(`${cancelled} agendamento${cancelled !== 1 ? 's' : ''} cancelado${cancelled !== 1 ? 's' : ''}`)
		}

		return {
			success: true,
			message: parts.join(', ') + '.',
			sent,
			cancelled,
		}
	} catch (error) {
		console.error('Erro ao notificar indisponibilidade:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})

		if (error instanceof z.ZodError) {
			return { success: false, error: error.issues[0]?.message || 'Dados inválidos' }
		}

		return { success: false, error: 'Erro ao notificar clientes. Tente novamente.' }
	}
}
