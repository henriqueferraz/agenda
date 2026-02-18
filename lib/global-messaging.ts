/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Utilitário server-side para envio de mensagens globais via webhook N8N (GLOBAL_N8N).
 * Monta o payload padronizado com TODOS os campos sempre presentes (campos não utilizados
 * vão como string vazia ''), inclui a tag `type` e envia com autenticação via header
 * `x-global-auth` contendo o GLOBAL_WEBHOOK_SECRET.
 *
 * Segue o mesmo padrão do webhook de agendamentos (webhook-notify.ts):
 * - Campos fixos, nunca dinâmicos
 * - Campos não aplicáveis = ''
 * - Tag `type` identifica a natureza da mensagem
 * - Erros logados silenciosamente, nunca interrompem o fluxo
 *
 * @example
 * import { sendGlobalMessage } from '@/lib/global-messaging'
 *
 * await sendGlobalMessage({
 *   type: 'reminder_24h',
 *   userId: 'usr_1',
 *   channel: 'whatsapp',
 *   clientName: 'Maria Souza',
 *   clientPhone: '5511988887777',
 *   appointmentDate: '2026-02-20',
 *   appointmentTime: '10:00',
 *   serviceName: 'Escova Progressiva',
 *   employeeName: 'Ana',
 *   managementLink: 'https://seusite.com/agendamento/gerenciar/abc123',
 *   message: 'Olá Maria! Seu agendamento é amanhã...',
 * })
 */
import prisma from '@/lib/prisma'

/**
 * Tipos de mensagem global suportados.
 * Cada tipo corresponde a uma funcionalidade ou fase do projeto.
 *
 * - F-03: reminder_7d, reminder_24h, reminder_2h
 * - F-07: custom_individual, custom_bulk, unavailability
 * - F-08: management_link, client_cancelled, client_rescheduled
 * - Engajamento: post_appointment, reengagement, birthday, feedback_request
 * - Marketing: promotion, new_service, seasonal, coupon
 * - Negócio: business_update, holiday_notice, new_employee
 * - Futuro: payment_confirmed, payment_reminder, waitlist_available, loyalty_reward
 */
export type GlobalMessageType =
	| 'reminder_7d'
	| 'reminder_24h'
	| 'reminder_2h'
	| 'custom_individual'
	| 'custom_bulk'
	| 'unavailability'
	| 'management_link'
	| 'client_cancelled'
	| 'client_rescheduled'
	| 'post_appointment'
	| 'reengagement'
	| 'birthday'
	| 'feedback_request'
	| 'promotion'
	| 'new_service'
	| 'seasonal'
	| 'coupon'
	| 'business_update'
	| 'holiday_notice'
	| 'new_employee'
	| 'payment_confirmed'
	| 'payment_reminder'
	| 'waitlist_available'
	| 'loyalty_reward'

/**
 * Payload padronizado enviado ao N8N para mensagens globais.
 * TODOS os campos estão SEMPRE presentes. Campos não aplicáveis = ''.
 * Todos os valores são strings — sem exceção.
 */
export interface GlobalMessagePayload {
	/** Tag que identifica o tipo da mensagem (ex: 'reminder_24h', 'custom_individual'). */
	type: GlobalMessageType
	/** Token da empresa no N8N — identifica quem originou a mensagem. */
	token_called: string
	/** Canal de envio: 'whatsapp', 'email' ou 'both'. */
	channel: string
	/** Nome do destinatário (cliente ou profissional). */
	clientName: string
	/** Telefone do destinatário formatado (ex: '5511999998888'). */
	clientPhone: string
	/** Email do destinatário. */
	clientEmail: string
	/** Data do agendamento vinculado (YYYY-MM-DD) ou ''. */
	appointmentDate: string
	/** Horário do agendamento vinculado (HH:mm) ou ''. */
	appointmentTime: string
	/** Nome do serviço vinculado ou ''. */
	serviceName: string
	/** Preço do serviço em centavos como string (ex: '5000') ou ''. */
	servicePrice: string
	/** Duração do serviço em minutos como string (ex: '30') ou ''. */
	serviceDuration: string
	/** Nome do funcionário/profissional vinculado ou ''. */
	employeeName: string
	/** Data original antes de alteração (YYYY-MM-DD) ou ''. */
	oldDate: string
	/** Horário original antes de alteração (HH:mm) ou ''. */
	oldTime: string
	/** Nova data após alteração (YYYY-MM-DD) ou ''. */
	newDate: string
	/** Novo horário após alteração (HH:mm) ou ''. */
	newTime: string
	/** Motivo da ação (cancelamento, reagendamento, etc.) ou ''. */
	reason: string
	/** Link público de autogestão (F-08) ou ''. */
	managementLink: string
	/** Corpo/texto da mensagem enviada ao destinatário. */
	message: string
	/** Nome do profissional/empresa (para mensagens de negócio) ou ''. */
	professionalName: string
	/** Código de promoção/cupom ou ''. */
	promotionCode: string
	/** Data de expiração da promoção (YYYY-MM-DD) ou ''. */
	promotionExpiry: string
}

/**
 * Parâmetros de entrada para sendGlobalMessage.
 * O chamador informa apenas os campos relevantes — os demais serão preenchidos com ''.
 */
export interface GlobalMessageParams {
	/** Tag que identifica o tipo da mensagem. */
	type: GlobalMessageType
	/** ID do usuário (empresa) para buscar token_called no banco. */
	userId: string
	/** Canal de envio. */
	channel: 'whatsapp' | 'email' | 'both'
	/** Nome do destinatário. */
	clientName?: string
	/** Telefone do destinatário. */
	clientPhone?: string
	/** Email do destinatário. */
	clientEmail?: string
	/** Data do agendamento (YYYY-MM-DD). */
	appointmentDate?: string
	/** Horário do agendamento (HH:mm). */
	appointmentTime?: string
	/** Nome do serviço. */
	serviceName?: string
	/** Preço do serviço em centavos como string. */
	servicePrice?: string
	/** Duração do serviço em minutos como string. */
	serviceDuration?: string
	/** Nome do funcionário. */
	employeeName?: string
	/** Data original (YYYY-MM-DD). */
	oldDate?: string
	/** Horário original (HH:mm). */
	oldTime?: string
	/** Nova data (YYYY-MM-DD). */
	newDate?: string
	/** Novo horário (HH:mm). */
	newTime?: string
	/** Motivo da ação. */
	reason?: string
	/** Link de autogestão. */
	managementLink?: string
	/** Corpo da mensagem. */
	message?: string
	/** Nome do profissional/empresa. */
	professionalName?: string
	/** Código de promoção. */
	promotionCode?: string
	/** Data de expiração da promoção (YYYY-MM-DD). */
	promotionExpiry?: string
}

/** Nome do header HTTP para autenticação da rota global. */
export const GLOBAL_AUTH_HEADER = 'x-global-auth'

/** Timeout para chamada ao N8N (30 segundos). */
const WEBHOOK_TIMEOUT_MS = 30_000

/**
 * Busca o token_called do usuário para incluir no payload.
 *
 * @param userId - ID do usuário (empresa)
 * @returns token_called ou string vazia
 *
 * @example
 * const token = await getTokenCalled('usr_1')
 * // Retorna: 'abc123-token-da-empresa' ou ''
 */
const getTokenCalled = async (userId: string): Promise<string> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { token_called: true },
		})
		return user?.token_called ?? ''
	} catch {
		return ''
	}
}

/**
 * Monta o payload padronizado a partir dos parâmetros de entrada.
 * Campos não informados são preenchidos com ''.
 *
 * @param params - Parâmetros fornecidos pelo chamador
 * @param tokenCalled - Token da empresa já obtido do banco
 * @returns Payload completo com todos os 22 campos preenchidos
 *
 * @example
 * const payload = buildPayload({ type: 'reminder_24h', userId: 'usr_1', channel: 'whatsapp', clientName: 'Maria' }, 'token-123')
 */
export const buildPayload = (
	params: GlobalMessageParams,
	tokenCalled: string,
): GlobalMessagePayload => ({
	type: params.type,
	token_called: tokenCalled,
	channel: params.channel,
	clientName: params.clientName ?? '',
	clientPhone: params.clientPhone ?? '',
	clientEmail: params.clientEmail ?? '',
	appointmentDate: params.appointmentDate ?? '',
	appointmentTime: params.appointmentTime ?? '',
	serviceName: params.serviceName ?? '',
	servicePrice: params.servicePrice ?? '',
	serviceDuration: params.serviceDuration ?? '',
	employeeName: params.employeeName ?? '',
	oldDate: params.oldDate ?? '',
	oldTime: params.oldTime ?? '',
	newDate: params.newDate ?? '',
	newTime: params.newTime ?? '',
	reason: params.reason ?? '',
	managementLink: params.managementLink ?? '',
	message: params.message ?? '',
	professionalName: params.professionalName ?? '',
	promotionCode: params.promotionCode ?? '',
	promotionExpiry: params.promotionExpiry ?? '',
})

/**
 * Envia uma mensagem global para o N8N via webhook.
 *
 * Monta o payload padronizado (22 campos fixos), inclui o header `x-global-auth`
 * com o valor de GLOBAL_WEBHOOK_SECRET para autenticação, e envia via POST para
 * a URL definida em GLOBAL_N8N.
 *
 * O N8N verifica o header:
 * - Se `x-global-auth` está presente e o valor bate com o secret → processa
 * - Se ausente ou diferente → descarta a mensagem
 *
 * Erros são logados silenciosamente — NUNCA interrompem o fluxo principal.
 *
 * @param params - Tipo da mensagem, userId, canal e campos relevantes
 * @returns void
 *
 * @example
 * ```typescript
 * // Lembrete 24h
 * await sendGlobalMessage({
 *   type: 'reminder_24h',
 *   userId: session.id,
 *   channel: 'whatsapp',
 *   clientName: 'Maria Souza',
 *   clientPhone: '5511988887777',
 *   appointmentDate: '2026-02-20',
 *   appointmentTime: '10:00',
 *   serviceName: 'Escova Progressiva',
 *   employeeName: 'Ana',
 *   managementLink: 'https://seusite.com/agendamento/gerenciar/abc123',
 *   message: 'Olá Maria! Seu agendamento é amanhã!',
 * })
 *
 * // Mensagem individual do profissional
 * await sendGlobalMessage({
 *   type: 'custom_individual',
 *   userId: session.id,
 *   channel: 'whatsapp',
 *   clientName: 'João Silva',
 *   clientPhone: '5511999998888',
 *   message: 'Olá João, temos promoção esta semana!',
 * })
 *
 * // Cliente cancelou (notifica profissional)
 * await sendGlobalMessage({
 *   type: 'client_cancelled',
 *   userId: 'usr_empresa',
 *   channel: 'whatsapp',
 *   clientName: 'Henrique Ferraz',
 *   clientPhone: '5521999990000',
 *   appointmentDate: '2026-02-20',
 *   appointmentTime: '10:00',
 *   serviceName: 'Escova Progressiva',
 *   employeeName: 'Ana',
 *   reason: 'Não poderei comparecer',
 *   message: 'O cliente Maria cancelou o agendamento...',
 * })
 * ```
 */
export const sendGlobalMessage = async (
	params: GlobalMessageParams,
): Promise<void> => {
	try {
		const webhookUrl = process.env.GLOBAL_N8N
		if (!webhookUrl) {
			return
		}

		const globalSecret = process.env.GLOBAL_WEBHOOK_SECRET
		if (!globalSecret) {
			console.error('[GLOBAL-MSG] GLOBAL_WEBHOOK_SECRET não está configurado')
			return
		}

		const tokenCalled = await getTokenCalled(params.userId)
		const payload = buildPayload(params, tokenCalled)
		const bodyStr = JSON.stringify(payload)

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			[GLOBAL_AUTH_HEADER]: globalSecret,
		}

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

		try {
			const response = await fetch(webhookUrl, {
				method: 'POST',
				headers,
				body: bodyStr,
				signal: controller.signal,
			})
			clearTimeout(timeoutId)

			if (!response.ok) {
				console.error(`[GLOBAL-MSG] Erro HTTP ao enviar ${params.type}:`, {
					status: response.status,
				})
			}
		} catch (fetchError) {
			clearTimeout(timeoutId)
			console.error(`[GLOBAL-MSG] Erro de rede ao enviar ${params.type}:`, {
				error: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido',
			})
		}
	} catch (error) {
		console.error('[GLOBAL-MSG] Erro inesperado:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
	}
}
