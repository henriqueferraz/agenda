/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Pagina publica de agendamento (rota `/agendamento/[token]`).
 * Delega a montagem do calendario a `renderPublicBookingPage` (mesmo fluxo que `/a/[code]`).
 */
import type { ReactElement } from 'react'
import { renderPublicBookingPage } from '../_lib/render-public-booking'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface PublicBookingPageProps {
	params: Promise<{
		token: string
	}>
}

/**
 * Server Component: agenda publica pelo token_called (slug-hash).
 *
 * @param props - params com segmento `token`
 * @returns JSX.Element
 *
 * @example
 * // GET /agendamento/barbearia-a1b2c3d4
 */
export const PublicBookingPage = async ({
	params,
}: PublicBookingPageProps): Promise<ReactElement> => {
	const { token: rawToken } = await params
	return renderPublicBookingPage(rawToken)
}

export default PublicBookingPage
