/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * Página de configuração de mensagens e envio WhatsApp (rota `/dashboard/services/message`).
 * Server Component que verifica autenticação, carrega MessageConfig e agendamentos
 * futuros, e renderiza MessagePageClient com F-03 (lembretes) e F-07 (envio de mensagens).
 *
 * @example
 * // Acesso via sidebar: Serviços > Mensagens
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMessageConfig } from './_data-access/get-message-config'
import { getFutureAppointments } from './_data-access/get-future-appointments'
import { MessagePageClient } from './_components/message-page-client'

/**
 * Página server de mensagens: configuração de lembretes (F-03) e envio WhatsApp (F-07).
 * Carrega configurações e agendamentos futuros para os dialogs.
 *
 * @returns JSX.Element — Página de mensagens renderizada
 */
export const MessagePage = async () => {
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}

	const [config, futureAppointments] = await Promise.all([
		getMessageConfig({ userId: user.id }),
		getFutureAppointments({ userId: user.id }),
	])

	return (
		<MessagePageClient
			config={config}
			userId={user.id}
			futureAppointments={futureAppointments}
		/>
	)
}

export default MessagePage
