/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Página de configuração de mensagens (rota `/dashboard/services/message`).
 * Server Component que verifica autenticação, carrega MessageConfig
 * e renderiza MessagePageClient com o formulário de lembretes (F-03).
 *
 * @example
 * // Acesso via sidebar: Serviços > Mensagens
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMessageConfig } from './_data-access/get-message-config'
import { MessagePageClient } from './_components/message-page-client'

/**
 * Página server de configuração de mensagens.
 * Carrega configurações de lembretes e renderiza o formulário.
 *
 * @returns JSX.Element — Página de mensagens renderizada
 */
export const MessagePage = async () => {
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}

	const config = await getMessageConfig({ userId: user.id })

	return <MessagePageClient config={config} userId={user.id} />
}

export default MessagePage
