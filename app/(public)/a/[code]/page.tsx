/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-23
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Pagina publica de agendamento via codigo curto (rota `/a/[code]`).
 * Resolve `booking_public_code` no banco e reutiliza o mesmo fluxo de `/agendamento/[token]`.
 */
import type { ReactElement } from 'react'
import { renderPublicBookingPage } from '@/app/(public)/agendamento/_lib/render-public-booking'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface ShortBookingPageProps {
	params: Promise<{
		code: string
	}>
}

/**
 * Server Component: agenda publica acessada por URL curta.
 *
 * @param props - params com `code` (booking_public_code)
 * @returns JSX.Element
 *
 * @example
 * // GET /a/k3m9p2x7q1w4r8t6y0z5
 */
const ShortBookingPage = async ({
	params,
}: ShortBookingPageProps): Promise<ReactElement> => {
	const { code } = await params
	return renderPublicBookingPage(code)
}

export default ShortBookingPage
