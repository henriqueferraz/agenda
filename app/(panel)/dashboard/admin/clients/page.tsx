/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Pagina do painel admin para gerenciar clientes de todos os usuarios.
 * Acessivel apenas por usuarios com role master.
 * Exibe tabela global de clientes com opcao de editar CPF.
 *
 * @example
 * // GET /dashboard/admin/clients
 */
import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/lib/auth'
import { getAllClients } from './_data-access/get-all-clients'
import { ClientsTableClient } from './_components/clients-table-client'
import { SidebarTrigger } from '@/components/ui/sidebar'

/**
 * Server Component do painel admin de clientes.
 * Verifica se o usuario e master, busca todos os clientes e renderiza a tabela.
 */
const AdminClientsPage = async () => {
	const user = await getUserFromToken()
	if (!user) redirect('/')

	if (user.role !== 'master') redirect('/dashboard')

	const { clients, total } = await getAllClients()

	return (
		<main className='flex-1 p-4 sm:p-6'>
			<div className='flex items-center gap-2 mb-4 sm:mb-6'>
				<SidebarTrigger className='sm:hidden' />
				<h1 className='text-xl sm:text-2xl font-bold'>Clientes — Administração</h1>
			</div>
			<ClientsTableClient initialClients={clients} initialTotal={total} />
		</main>
	)
}

export default AdminClientsPage
