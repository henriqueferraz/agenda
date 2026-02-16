/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Request
 *
 * Visao geral:
 * - Casos de teste para Request.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar contratos e comportamento esperado.
 * - Cobrir cenarios de sucesso e falha.
 * - Proteger contra regressao.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/tests/helpers/request";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest } from 'next/server'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
type RequestInitOverrides = Omit<RequestInit, 'method' | 'body' | 'signal'> & {
	headers?: Record<string, string>
	signal?: AbortSignal
}
export const createJsonRequest = (
	url: string,
	body: unknown,
	init: RequestInitOverrides = {},
) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const headers = {
		'content-type': 'application/json',
		...init.headers,
	}
	return new NextRequest(url, {
		...init,
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	})
}
export const createRequestWithCookies = (
	url: string,
	method: string,
	cookies: Record<string, string>,
	init: RequestInitOverrides = {},
) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const cookieHeader = Object.entries(cookies)
		.map(([key, value]) => `${key}=${value}`)
		.join('; ')
	const headers = {
		...init.headers,
		cookie: cookieHeader,
	}
	return new NextRequest(url, {
		...init,
		method,
		headers,
	})
}
export const readJson = async <T = unknown>(response: Response): Promise<T> => {
	return (await response.json()) as T
}
