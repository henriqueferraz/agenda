/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Pagina do painel admin para gerenciar usuarios enterprise.
 * Acessivel apenas por usuarios com role master.
 * Exibe tabela de usuarios enterprise com opcao de estender trial.
 *
 * @example
 * // GET /dashboard/admin/users
 */
import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/lib/auth'
import { getEnterpriseUsers } from './_data-access/get-enterprise-users'
import { UsersTableClient } from './_components/users-table-client'
import { SidebarTrigger } from '@/components/ui/sidebar'

/**
 * Server Component do painel admin de usuarios.
 * Verifica se o usuario e master, busca usuarios enterprise e renderiza a tabela.
 */
const AdminUsersPage = async () => {
	const user = await getUserFromToken()
	if (!user) redirect('/')

	if (user.role !== 'master') redirect('/dashboard')

	const { users, total } = await getEnterpriseUsers()

	return (
		<main className='flex-1 p-4 sm:p-6'>
			<div className='flex items-center gap-2 mb-4 sm:mb-6'>
				<SidebarTrigger className='sm:hidden' />
				<h1 className='text-xl sm:text-2xl font-bold'>Administração</h1>
			</div>
			<UsersTableClient initialUsers={users} initialTotal={total} />
		</main>
	)
}

export default AdminUsersPage
