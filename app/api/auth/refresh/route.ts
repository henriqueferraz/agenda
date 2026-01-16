/**
 * API Route - /api/auth/refresh
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/refresh`.
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
 * import * as modulo from "@/app/api/auth/refresh/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
	verifyRefreshToken,
	signAccessToken,
	signRefreshToken,
} from '@/lib/jwt'
import { hashToken } from '@/lib/tokens'
import { setAuthCookies } from '@/lib/auth-cookies'
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
		const refreshCookie = request.cookies.get('refresh_token')?.value
		if (!refreshCookie) {
			return NextResponse.json(
				{ error: 'Refresh token ausente.' },
				{ status: 401 },
			)
		}
		const payload = verifyRefreshToken(refreshCookie)
		const tokenHash = hashToken(refreshCookie)
		const stored = await prisma.refreshToken.findFirst({
			where: {
				tokenHash,
				revokedAt: null,
				expiresAt: { gt: new Date() },
			},
		})
		if (!stored) {
			return NextResponse.json(
				{ error: 'Refresh token inválido.' },
				{ status: 401 },
			)
		}
		await prisma.refreshToken.update({
			where: { id: stored.id },
			data: { revokedAt: new Date() },
		})
		const newPayload = {
			sub: payload.sub,
			email: payload.email,
			name: payload.name,
		}
		const newAccess = signAccessToken(newPayload)
		const newRefresh = signRefreshToken(newPayload)
		await prisma.refreshToken.create({
			data: {
				userId: payload.sub,
				tokenHash: hashToken(newRefresh),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		})
		const response = NextResponse.json({ message: 'Token atualizado.' })
		setAuthCookies(response, newAccess, newRefresh)
		return response
	} catch (error) {
		console.error('Erro ao atualizar token:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao atualizar token.' },
			{ status: 500 },
		)
	}
}
