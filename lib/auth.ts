/**
 * Utilitario - Auth
 *
 * Visao geral:
 * - Funcoes de suporte para Auth.
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
 * import * as modulo from "@/lib/auth";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import prisma from './prisma'
import { verifyAccessToken } from './jwt'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const userSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
	be_called: true,
	token_called: true,
}
export const getUserFromToken = async () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const cookieStore = await cookies()
	const token = cookieStore.get('auth_token')?.value
	if (!token) return null
	try {
		const payload = verifyAccessToken(token)
		return await prisma.user.findUnique({
			where: { id: payload.sub },
			select: userSelect,
		})
	} catch {
		return null
	}
}
export const getUserFromRequest = async (request: NextRequest) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const token = request.cookies.get('auth_token')?.value
	if (!token) return null
	try {
		const payload = verifyAccessToken(token)
		return await prisma.user.findUnique({
			where: { id: payload.sub },
			select: userSelect,
		})
	} catch {
		return null
	}
}
