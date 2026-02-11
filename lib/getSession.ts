/**
 * Reexporta getUserFromToken como default para obter a sessão do usuário a partir dos cookies.
 * Usado em Server Components e Server Actions como ponto único de acesso à sessão.
 *
 * @example
 * import getSession from '@/lib/getSession'
 * const user = await getSession()
 * if (!user) redirect('/login')
 */
import { getUserFromToken } from './auth'
export default getUserFromToken
