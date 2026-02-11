/**
 * Rota que retorna o usuário autenticado. Resolve o usuário a partir do token
 * (cookie ou header) e devolve os dados do usuário ou 401 se não autenticado.
 *
 * @example
 * const res = await fetch('/api/auth/me', {
 *   method: 'GET',
 *   credentials: 'include',
 * })
 * const { user } = await res.json()
 */
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

/**
 * Handler GET para obter o usuário autenticado. Usa cookies/headers da requisição
 * para identificar o usuário e retorna seus dados ou null com 401.
 *
 * @param request - Requisição contendo cookies/headers de autenticação.
 * @returns NextResponse com { user } em 200 ou { user: null } em 401.
 */
export const GET = async (request: NextRequest) => {
	const user = await getUserFromRequest(request)
	if (!user) {
		return NextResponse.json({ user: null }, { status: 401 })
	}
	return NextResponse.json({ user })
}
