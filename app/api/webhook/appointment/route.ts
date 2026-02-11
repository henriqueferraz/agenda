/**
 * Rota POST /api/webhook/appointment: proxy de webhook para agendamentos. Recebe o
 * payload do cliente e reenvia em POST para a URL do N8N (NEXT_PUBLIC_BASE_N8N);
 * retorna o resultado do N8N ou erro com status adequado.
 *
 * @example
 * const res = await fetch('/api/webhook/appointment', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ appointmentId: '...', ... }),
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'

/**
 * Handler POST: encaminha payload de agendamento para o webhook N8N configurado.
 *
 * @param request - Requisição com body JSON do agendamento a ser repassado ao N8N.
 * @returns NextResponse com { success, data } em 200 ou { error, details } em 500/status do N8N.
 */
export const POST = async (request: NextRequest) => {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_N8N
		if (!baseUrl) {
			console.error('[API WEBHOOK] NEXT_PUBLIC_BASE_N8N não está configurado')
			return NextResponse.json(
				{ error: 'Webhook URL não configurada' },
				{ status: 500 },
			)
		}
		// Obtém o payload do body da requisição
		const payload = await request.json()
		// Faz a chamada POST para o webhook N8N
		const response = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		})
		if (response.ok) {
			const responseData = await response.json().catch(() => null)
			return NextResponse.json(
				{ success: true, data: responseData },
				{ status: 200 },
			)
		} else {
			const errorText = await response
				.text()
				.catch(() => 'Não foi possível ler a resposta')
			console.error('[API WEBHOOK]  Erro HTTP:', {
				status: response.status,
				error: errorText,
			})
			return NextResponse.json(
				{
					error: `Webhook retornou status ${response.status}`,
					details: errorText,
				},
				{ status: response.status },
			)
		}
	} catch (error) {
		console.error('[API WEBHOOK]  Erro ao processar webhook:', error)
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}
		return NextResponse.json(
			{ error: 'Erro desconhecido ao processar webhook' },
			{ status: 500 },
		)
	}
}
