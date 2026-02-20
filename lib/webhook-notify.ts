/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Utilitário server-side para envio de notificações via webhook N8N.
 * Monta o payload no formato esperado pelo N8N, assina com HMAC-SHA256
 * e envia via POST. Usado pelas server actions de cancelamento,
 * reagendamento e edição de agendamentos (F-02).
 *
 * As funções NUNCA lançam exceções — erros são logados silenciosamente
 * para não interromper o fluxo principal das actions.
 *
 * @example
 * import { sendAppointmentWebhook } from '@/lib/webhook-notify'
 * await sendAppointmentWebhook({
 *   type: 'cancel',
 *   appointment: updatedAppointment,
 *   userId: 'usr_1',
 *   reason: 'Cliente solicitou',
 * })
 */
import prisma from '@/lib/prisma'
import { generateWebhookSignature } from '@/lib/webhook-hmac'
import { getDateComponentsInSaoPaulo } from '@/utils/date-timezone'
import { formatPhone } from '@/utils/formatPhone'

/** Tipos de evento suportados pelo webhook. */
type WebhookEventType = 'cancel' | 'reschedule' | 'edit'

/** Dados do agendamento retornados pelo core (inclui service, employee e client). */
interface AppointmentData {
	/** ID do agendamento. */
	id: string
	/** Data do agendamento. */
	appointmentDate: Date
	/** Horário no formato HH:MM. */
	time: string
	/** Serviço vinculado. */
	service: {
		/** ID do serviço. */
		id: string
		/** Nome do serviço. */
		name: string
		/** Preço em centavos. */
		price: number
		/** Duração em minutos. */
		duration: number
	}
	/** Funcionário vinculado. */
	employee: {
		/** ID do funcionário. */
		id: string
		/** Nome do funcionário. */
		name: string
	}
	/** Cliente vinculado (F-10). */
	client: {
		id: string
		name: string
		email: string
		phone: string
	}
}

/** Parâmetros para envio de notificação via webhook. */
interface WebhookNotifyParams {
	/** Tipo do evento: cancel, reschedule ou edit. */
	type: WebhookEventType
	/** Dados do agendamento (retorno do core com include service + employee). */
	appointment: AppointmentData
	/** ID do usuário (empresa) para buscar token_called. */
	userId: string
	/** Motivo da ação (cancelamento, reagendamento ou edição). */
	reason?: string
	/** Data original antes da alteração no formato YYYY-MM-DD (para type: reschedule e edit). */
	oldDate?: string
	/** Horário original antes da alteração no formato HH:MM (para type: reschedule e edit). */
	oldTime?: string
	/** Link de autogestão do cliente (F-08). */
	managementLink?: string
}

/** Timeout para chamada ao N8N (30 segundos). */
const WEBHOOK_TIMEOUT_MS = 30_000

/**
 * Busca o token_called do usuário para incluir no payload do webhook.
 *
 * @param userId - ID do usuário (empresa)
 * @returns token_called ou null
 */
const getTokenCalled = async (userId: string): Promise<string | null> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { token_called: true },
		})
		return user?.token_called ?? null
	} catch {
		return null
	}
}

/**
 * Envia notificação de agendamento via webhook para o N8N.
 * Monta o payload no formato padrão, assina com HMAC-SHA256 e envia via POST.
 *
 * Erros são logados silenciosamente — NUNCA interrompem o fluxo principal.
 *
 * @param params - Tipo do evento, dados do agendamento, userId e campos extras
 * @returns void
 *
 * @example
 * ```typescript
 * // Cancelamento
   * await sendAppointmentWebhook({
   *   type: 'cancel',
   *   appointment: cancelledAppointment,
   *   userId: session.id,
   *   reason: 'Profissional indisponível',
   * })
   *
   * // Reagendamento
   * await sendAppointmentWebhook({
   *   type: 'reschedule',
   *   appointment: rescheduledAppointment,
   *   userId: session.id,
   *   oldDate: '2026-02-16',
   *   oldTime: '10:00',
   *   reason: 'Cliente solicitou novo horário',
   * })
   *
   * // Edição (payload inclui newDate/newTime automaticamente a partir do appointment)
   * await sendAppointmentWebhook({
   *   type: 'edit',
   *   appointment: editedAppointment,
   *   userId: session.id,
   *   oldDate: '2026-02-16',
   *   oldTime: '10:00',
   *   reason: 'Troca de profissional',
   * })
 * ```
 */
export const sendAppointmentWebhook = async (
	params: WebhookNotifyParams,
): Promise<void> => {
	try {
		const baseUrl = process.env.BASE_N8N
		if (!baseUrl) {
			return
		}

		const { type, appointment, userId, reason, oldDate, oldTime, managementLink } = params

		const tokenCalled = await getTokenCalled(userId)

		const dateComponents = getDateComponentsInSaoPaulo(appointment.appointmentDate)
		const dateStr = `${dateComponents.year}-${String(dateComponents.month + 1).padStart(2, '0')}-${String(dateComponents.day).padStart(2, '0')}`

		const formattedPhone = formatPhone(appointment.client.phone)

		const isChangeEvent = type === 'reschedule' || type === 'edit'

		const body: Record<string, unknown> = {
			type,
			name: appointment.client.name,
			email: appointment.client.email,
			phone: formattedPhone,
			token_called: tokenCalled,
			reason: reason ?? '',
			oldDate: isChangeEvent && oldDate ? oldDate : '',
			oldTime: isChangeEvent && oldTime ? oldTime : '',
			newDate: isChangeEvent && oldDate && oldTime ? dateStr : '',
			newTime: isChangeEvent && oldDate && oldTime ? appointment.time : '',
			managementLink: managementLink ?? '',
			appointments: [
				{
					date: dateStr,
					time: appointment.time,
					services: [
						{
							id: appointment.service.id,
							name: appointment.service.name,
							price: appointment.service.price,
							duration: appointment.service.duration,
							employee: {
								id: appointment.employee.id,
								name: appointment.employee.name,
							},
						},
					],
				},
			],
		}

		const payload = [
			{
				headers: {},
				params: {},
				query: {},
				body,
				webhookUrl: '',
				executionMode: 'production',
			},
		]

		const bodyStr = JSON.stringify(payload)

		const outboundHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
		}

		if (process.env.WEBHOOK_AUTH_TOKEN) {
			outboundHeaders['x-webhook-auth'] = process.env.WEBHOOK_AUTH_TOKEN
		}

		if (process.env.WEBHOOK_SECRET) {
			outboundHeaders['x-webhook-signature'] = generateWebhookSignature(bodyStr)
		}

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

		try {
			const response = await fetch(baseUrl, {
				method: 'POST',
				headers: outboundHeaders,
				body: bodyStr,
				signal: controller.signal,
			})
			clearTimeout(timeoutId)

			if (!response.ok) {
				console.error(`[WEBHOOK-NOTIFY] Erro HTTP ao enviar ${type}:`, {
					status: response.status,
				})
			}
		} catch (fetchError) {
			clearTimeout(timeoutId)
			console.error(`[WEBHOOK-NOTIFY] Erro de rede ao enviar ${type}:`, {
				error: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido',
			})
		}
	} catch (error) {
		console.error('[WEBHOOK-NOTIFY] Erro inesperado:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
	}
}
