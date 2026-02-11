/**
 * Autenticação por token JWT em cookies: obtém usuário a partir do cookie auth_token
 * em Server Components (getUserFromToken) ou em API Routes (getUserFromRequest).
 *
 * @example
 * import { getUserFromToken, getUserFromRequest } from '@/lib/auth'
 * const user = await getUserFromToken()
 * if (!user) redirect('/login')
 */
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import prisma from './prisma'
import { verifyAccessToken } from './jwt'
const userSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
	be_called: true,
	token_called: true,
}
/**
 * Obtem o usuario autenticado a partir do token JWT armazenado nos cookies.
 * Utilizado em Server Components e Server Actions para verificar a sessao.
 * @returns Dados do usuario autenticado ou null se nao autenticado
 * @example
 * const user = await getUserFromToken()
 * if (!user) redirect('/login')
 */
export const getUserFromToken = async () => {
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
/**
 * Obtem o usuario autenticado a partir do token JWT presente na requisicao.
 * Utilizado em API Routes para verificar a sessao via NextRequest.
 * @param request - Objeto NextRequest contendo os cookies da requisicao
 * @returns Dados do usuario autenticado ou null se nao autenticado
 * @example
 * export const GET = async (request: NextRequest) => {
 *   const user = await getUserFromRequest(request)
 *   if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
 * }
 */
export const getUserFromRequest = async (request: NextRequest) => {
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
