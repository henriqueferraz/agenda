/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Página de bloqueio de horários específicos por funcionário
 * (rota `/dashboard/schedule/blocked-time`). Server Component que verifica
 * autenticação e renderiza ModelBlockedTime para listar, criar e excluir bloqueios.
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ModelBlockedTime } from './_components/model-blocked-time'

/**
 * Página de gerenciamento de bloqueios de horário por funcionário.
 * Redireciona para login se não autenticado; caso contrário, renderiza
 * o container ModelBlockedTime.
 *
 * @returns JSX da página com ModelBlockedTime
 *
 * @example
 * ```
 * // Acessada via rota /dashboard/schedule/blocked-time
 * ```
 */
export const BlockedTimePage = async () => {
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}
	return <ModelBlockedTime userId={user.id} />
}

export default BlockedTimePage
