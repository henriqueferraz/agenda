/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rota de logout. Revoga o refresh token presente no cookie (marca como revogado
 * no banco) e remove os cookies de autenticação da resposta.
 *
 * @example
 * const res = await fetch('/api/auth/logout', {
 *   method: 'POST',
 *   credentials: 'include',
 * })
 * const data = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashToken } from '@/lib/tokens'
import { clearAuthCookies } from '@/lib/auth-cookies'

/**
 * Handler POST para logout. Revoga o refresh_token do cookie no banco (se
 * existir) e limpa os cookies de auth na resposta.
 *
 * @param request - Requisição (cookies usados para obter refresh_token).
 * @returns NextResponse com message em 200 ou error em 500; cookies sempre limpos.
 */
export const POST = async (request: NextRequest) => {
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
