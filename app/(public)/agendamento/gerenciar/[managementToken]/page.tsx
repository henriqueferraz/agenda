/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Página pública de autogestão do cliente (F-08). Rota: `/agendamento/gerenciar/[managementToken]`.
 * Server Component que busca o agendamento pelo token e renderiza a interface
 * de cancelamento/reagendamento. Não requer login.
 *
 * @example
 * // URL: /agendamento/gerenciar/3a7f2c...
 * // Renderiza ManagementPage com dados do agendamento
 */
import type { Metadata } from 'next'
import { getAppointmentByManagementToken } from './_data-access/get-appointment-by-management-token'
import { ManagementPage } from './_components/management-page'
import { ManagementError } from './_components/management-error'

/** Metadata dinâmica para SEO. */
export const metadata: Metadata = {
	title: 'Gerenciar Agendamento',
	description: 'Cancele ou reagende seu agendamento.',
}

/** Props da página (params da rota dinâmica). */
interface ManagementPageProps {
	params: Promise<{
		managementToken: string
	}>
}

/**
 * Página pública de autogestão do agendamento (F-08).
 * Busca o agendamento pelo managementToken e exibe:
 * - Dados do agendamento (data, hora, serviço, profissional, endereço)
 * - Botões de cancelar e reagendar
 * - Mensagens de erro quando token inválido, cancelado ou expirado
 *
 * @param props - params com managementToken da URL
 * @returns JSX.Element — Página de gerenciamento ou mensagem de erro
 */
const AppointmentManagementPage = async ({ params }: ManagementPageProps) => {
	const { managementToken } = await params

	const result = await getAppointmentByManagementToken({ managementToken })

	if (!result.appointment) {
		return <ManagementError error={result.error ?? 'not_found'} />
	}

	return <ManagementPage appointment={result.appointment} />
}

export default AppointmentManagementPage
