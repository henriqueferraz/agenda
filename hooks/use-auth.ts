/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Hook React que obtém o usuário autenticado via GET /api/auth/me.
 * Retorna user e loading; usado em componentes do painel para proteger rotas e exibir dados do usuário.
 *
 * @example
 * const { user, loading } = useAuth()
 * if (loading) return <Spinner />
 * if (!user) redirect('/login')
 */
import { useEffect, useState } from 'react'
interface AuthUser {
	id: string
	name: string | null
	email: string | null
	image: string | null
	be_called?: string | null
	token_called?: string | null
}
/**
 * Hook de autenticacao que busca os dados do usuario logado via API.
 * Realiza uma chamada GET para /api/auth/me ao montar o componente.
 * @returns Objeto com { user, loading } - dados do usuario e estado de carregamento
 * @example
 * const { user, loading } = useAuth()
 * if (loading) return <Spinner />
 * if (!user) redirect('/login')
 */
export const useAuth = () => {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [loading, setLoading] = useState(true)
	useEffect(() => {
		const load = async () => {
			setLoading(true)
			try {
				const res = await fetch('/api/auth/me')
				if (!res.ok) {
					setUser(null)
					return
				}
				const data = await res.json()
				setUser(data.user || null)
			} catch {
				setUser(null)
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])
	return { user, loading }
}
