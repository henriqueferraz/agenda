/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/webhook/appointment: proxy autenticado de webhook para agendamentos.
 * Valida autenticacao via cookie JWT, valida payload com Zod, aplica rate limiting
 * e reenvia em POST para a URL do N8N (BASE_N8N). Retorna resultado ou erro.
 *
 * @example
 * const res = await fetch('/api/webhook/appointment', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   credentials: 'include',
 *   body: JSON.stringify(payload),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
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
			name: z.string().min(1).max(255),
			email: z.string().email(),
			phone: z.string().min(1).max(30),
			token_called: z.string().nullable(),
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
 * Handler POST: valida autenticacao, payload e encaminha para o webhook N8N.
 *
 * @param request - Requisicao com cookie JWT e body JSON do agendamento.
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

		// Verifica tamanho do payload
		const contentLength = request.headers.get('content-length')
		if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
			return NextResponse.json(
				{ error: 'Payload muito grande.' },
				{ status: 413 },
			)
		}

		const baseUrl = process.env.NEXT_PUBLIC_BASE_N8N
		if (!baseUrl) {
			console.error('[API WEBHOOK] NEXT_PUBLIC_BASE_N8N não está configurado')
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

		// Faz a chamada POST para o webhook N8N com o payload validado
		const response = await fetch(baseUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(parsed.data),
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
		console.error('[API WEBHOOK] Erro ao processar webhook:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao processar webhook.' },
			{ status: 500 },
		)
	}
}
