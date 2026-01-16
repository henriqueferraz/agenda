/**
 * API Route - /api/webhook/appointment
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/webhook/appointment`.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar entrada e preparar a resposta HTTP.
 * - Coordenar chamadas aos serviços internos.
 * - Garantir consistencia de erros e status.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/api/webhook/appointment/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const POST = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
		console.log('[API WEBHOOK] Enviando para N8N:', {
			url: baseUrl,
			payload: payload,
		})
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
			console.log('[API WEBHOOK]  Sucesso:', {
				status: response.status,
				response: responseData,
			})
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
