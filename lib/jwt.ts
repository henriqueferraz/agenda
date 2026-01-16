/**
 * Utilitario - Jwt
 *
 * Visao geral:
 * - Funcoes de suporte para Jwt.
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
 * import * as modulo from "@/lib/jwt";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import jwt from 'jsonwebtoken'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export interface AuthTokenPayload {
	sub: string
	email: string
	name?: string | null
}
const ACCESS_EXPIRES_IN = '15m'
const REFRESH_EXPIRES_IN = '7d'
const getAccessSecret = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const secret = process.env.JWT_SECRET
	if (!secret) {
		throw new Error('JWT_SECRET não está configurado')
	}
	return secret
}
const getRefreshSecret = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const secret = process.env.JWT_REFRESH_SECRET
	if (!secret) {
		throw new Error('JWT_REFRESH_SECRET não está configurado')
	}
	return secret
}
export const signAccessToken = (payload: AuthTokenPayload) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return jwt.sign(payload, getAccessSecret(), {
		expiresIn: ACCESS_EXPIRES_IN,
		algorithm: 'HS256',
	})
}
export const signRefreshToken = (payload: AuthTokenPayload) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return jwt.sign(payload, getRefreshSecret(), {
		expiresIn: REFRESH_EXPIRES_IN,
		algorithm: 'HS256',
	})
}
export const verifyAccessToken = (token: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return jwt.verify(token, getAccessSecret()) as AuthTokenPayload
}
export const verifyRefreshToken = (token: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return jwt.verify(token, getRefreshSecret()) as AuthTokenPayload
}
export const ACCESS_TOKEN_MAX_AGE = 60 * 15
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7
