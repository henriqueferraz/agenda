/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/webhook/appointment: proxy autenticado de webhook para agendamentos.
 * Valida autenticacao via cookie JWT, protege contra replay attacks (timestamp + nonce),
 * valida payload com Zod, assina com HMAC-SHA256 e reenvia em POST para o N8N.
 *
 * Camadas de segurança:
 * 1. Autenticação JWT via cookie
 * 2. Anti-replay: timestamp (5 min) + nonce único
 * 3. Assinatura HMAC-SHA256 no envio ao N8N (header x-webhook-signature)
 *
 * @example
 * const res = await fetch('/api/webhook/appointment', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
 *     'x-webhook-nonce': crypto.randomUUID(),
 *   },
 *   credentials: 'include',
 *   body: JSON.stringify(payload),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { validateWebhookTimestamp, validateWebhookNonce } from '@/lib/webhook-nonce'
import { generateWebhookSignature } from '@/lib/webhook-hmac'
import { z } from 'zod'

/** Tamanho maximo do payload em bytes (100KB) */
const MAX_PAYLOAD_SIZE = 1024 * 100

/** Schema de validacao do payload do webhook */
const webhookPayloadSchema = z.array(
	z.object({
		headers: z.record(z.string(), z.unknown()).optional(),
		params: z.record(z.string(), z.unknown()).optional(),
		query: z.record(z.string(), z.unknown()).optional(),
		body: z.object({
			type: z
				.enum(['create', 'cancel', 'reschedule', 'edit'])
				.default('create'),
			name: z.string().min(1).max(255),
			email: z.string().email(),
			phone: z.string().min(1).max(30),
			token_called: z.string().nullable(),
			cancelReason: z.string().max(500).optional(),
			changeReason: z.string().max(500).optional(),
			oldDate: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.optional(),
		oldTime: z
			.string()
			.regex(/^([0-1]\d|2[0-3]):[0-5]\d$/)
			.optional(),
		newDate: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}$/)
			.optional(),
		newTime: z
			.string()
			.regex(/^([0-1]\d|2[0-3]):[0-5]\d$/)
			.optional(),
		appointments: z.array(
				z.object({
					date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
					time: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/),
					services: z.array(
						z.object({
							id: z.string().min(1),
							name: z.string().min(1),
							price: z.number(),
							duration: z.number(),
							employee: z.object({
								id: z.string().min(1),
								name: z.string().min(1),
							}),
						}),
					),
				}),
			),
		}),
		webhookUrl: z.string().optional(),
		executionMode: z.string().optional(),
	}),
)

/**
 * Handler POST: valida autenticacao, anti-replay, payload e encaminha com HMAC para o N8N.
 *
 * @param request - Requisicao com cookie JWT, headers anti-replay e body JSON.
 * @returns NextResponse com { success, data } em 200 ou { error } em 400/401/413/500.
 */
export const POST = async (request: NextRequest) => {
	try {
		// Verifica autenticacao do usuario via cookie JWT
		const user = await getUserFromRequest(request)
		if (!user) {
			return NextResponse.json(
				{ error: 'Não autenticado.' },
				{ status: 401 },
			)
		}

		// Valida proteção contra replay attacks (timestamp + nonce)
		const timestamp = request.headers.get('x-webhook-timestamp')
		if (!validateWebhookTimestamp(timestamp)) {
			return NextResponse.json(
				{ error: 'Timestamp inválido ou expirado.' },
				{ status: 400 },
			)
		}

		const nonce = request.headers.get('x-webhook-nonce')
		if (!validateWebhookNonce(nonce)) {
			return NextResponse.json(
				{ error: 'Requisição duplicada ou nonce inválido.' },
				{ status: 400 },
			)
		}

		// Verifica tamanho do payload
		const contentLength = request.headers.get('content-length')
		if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
			return NextResponse.json(
				{ error: 'Payload muito grande.' },
				{ status: 413 },
			)
		}

		const baseUrl = process.env.BASE_N8N
		if (!baseUrl) {
			console.error('[API WEBHOOK] BASE_N8N não está configurado')
			return NextResponse.json(
				{ error: 'Webhook URL não configurada.' },
				{ status: 500 },
			)
		}

		// Valida o payload com Zod
		const rawPayload = await request.json()
		const parsed = webhookPayloadSchema.safeParse(rawPayload)
		if (!parsed.success) {
			return NextResponse.json(
				{ error: 'Payload inválido.' },
				{ status: 400 },
			)
		}

		// Serializa o payload validado e gera assinatura HMAC-SHA256
		const bodyStr = JSON.stringify(parsed.data)
		const outboundHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
		}

		// Envia token de autenticação para o N8N identificar a origem
		if (process.env.WEBHOOK_AUTH_TOKEN) {
			outboundHeaders['x-webhook-auth'] = process.env.WEBHOOK_AUTH_TOKEN
		}

		// Assina com HMAC se WEBHOOK_SECRET estiver configurado
		if (process.env.WEBHOOK_SECRET) {
			outboundHeaders['x-webhook-signature'] = generateWebhookSignature(bodyStr)
		}

		// Faz a chamada POST para o webhook N8N com payload validado e assinatura HMAC
		const response = await fetch(baseUrl, {
			method: 'POST',
			headers: outboundHeaders,
			body: bodyStr,
		})

		if (response.ok) {
			const responseData = await response.json().catch(() => null)
			return NextResponse.json(
				{ success: true, data: responseData },
				{ status: 200 },
			)
		} else {
			console.error('[API WEBHOOK] Erro HTTP:', { status: response.status })
			return NextResponse.json(
				{ error: 'Erro ao processar webhook.' },
				{ status: response.status },
			)
		}
	} catch (error) {
		console.error('[API WEBHOOK] Erro ao processar webhook:', error instanceof Error ? error.message : 'Erro desconhecido')
		return NextResponse.json(
			{ error: 'Erro interno ao processar webhook.' },
			{ status: 500 },
		)
	}
}
