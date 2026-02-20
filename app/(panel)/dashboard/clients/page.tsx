/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Página de gestão de clientes (rota `/dashboard/clients`).
 * Server Component que verifica autenticação, carrega clientes via getClients
 * e renderiza ClientPageClient para listar, criar e editar clientes.
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClients } from './_data-access/get-clients'
import { ClientPageClient } from './_components/client-page-client'

/**
 * Página Server de Gestão de Clientes.
 *
 * @returns JSX.Element
 */
const ClientsPage = async () => {
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}

	const { clients, total } = await getClients({ userId: user.id, page: 1, perPage: 20 })

	return <ClientPageClient initialClients={clients} initialTotal={total} />
}

export default ClientsPage
