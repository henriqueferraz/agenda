/**
 * API Route - /api/auth/logout
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/auth/logout`.
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
 * import * as modulo from "@/app/api/auth/logout/route";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashToken } from '@/lib/tokens'
import { clearAuthCookies } from '@/lib/auth-cookies'
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
		if (refreshCookie) {
			const tokenHash = hashToken(refreshCookie)
			await prisma.refreshToken.updateMany({
				where: { tokenHash, revokedAt: null },
				data: { revokedAt: new Date() },
			})
		}
		const response = NextResponse.json({
			message: 'Logout realizado com sucesso.',
		})
		clearAuthCookies(response)
		return response
	} catch (error) {
		console.error('Erro ao fazer logout:', error)
		const response = NextResponse.json(
			{ error: 'Erro interno ao fazer logout.' },
			{ status: 500 },
		)
		clearAuthCookies(response)
		return response
	}
}
