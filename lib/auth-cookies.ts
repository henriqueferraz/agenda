/**
 * Utilitario - Auth Cookies
 *
 * Visao geral:
 * - Funcoes de suporte para Auth Cookies.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Fornecer utilitarios de dominio ou infraestrutura.
 * - Padronizar formatos e regras reutilizaveis.
 * - Evitar duplicacao de logica.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/lib/auth-cookies";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextResponse } from 'next/server'
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from './jwt'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
}
export const setAuthCookies = (
	response: NextResponse,
	accessToken: string,
	refreshToken: string,
) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	response.cookies.set('auth_token', accessToken, {
		...COOKIE_OPTIONS,
		maxAge: ACCESS_TOKEN_MAX_AGE,
	})
	response.cookies.set('refresh_token', refreshToken, {
		...COOKIE_OPTIONS,
		maxAge: REFRESH_TOKEN_MAX_AGE,
	})
}
export const clearAuthCookies = (response: NextResponse) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	response.cookies.set('auth_token', '', {
		...COOKIE_OPTIONS,
		maxAge: 0,
	})
	response.cookies.set('refresh_token', '', {
		...COOKIE_OPTIONS,
		maxAge: 0,
	})
}
