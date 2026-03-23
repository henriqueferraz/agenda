/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-23
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Monta a pagina publica de agendamento a partir do segmento de URL (token longo ou codigo curto).
 * Usado por `/agendamento/[token]` e `/a/[code]`.
 *
 * @example
 * // Em uma Server Component:
 * // return renderPublicBookingPage(rawFromParams)
 */
import type { ReactElement } from 'react'
import { notFound } from 'next/navigation'
import { getCompanyByToken } from '../[token]/_data-access/get-company-by-token'
import { getPublicCalendarData } from '../[token]/_data-access/get-public-calendar-data'
import { getPublicNextAppointmentDate } from '../[token]/_data-access/get-public-next-appointment-date'
import { PublicCalendar } from '../[token]/_components/public-calendar'

/**
 * Renderiza calendario publico de agendamento ou dispara notFound().
 *
 * @param rawLookup - Valor bruto do segmento de rota (pode vir codificado)
 * @returns JSX.Element da pagina de agendamento
 *
 * @example
 * const view = await renderPublicBookingPage('k3m9p2x7q1w4r8t6y0z5')
 */
export const renderPublicBookingPage = async (
	rawLookup: string,
): Promise<ReactElement> => {
	if (!rawLookup || typeof rawLookup !== 'string' || rawLookup.trim().length === 0) {
		console.warn('renderPublicBookingPage: segmento vazio ou invalido', { rawLookup })
		notFound()
	}

	let cleanSegment = rawLookup.split('?')[0].split('#')[0]

	let decodedSegment = cleanSegment
	try {
		decodedSegment = decodeURIComponent(cleanSegment)
	} catch {
		decodedSegment = cleanSegment
	}

	const lookup = decodedSegment.trim().toLowerCase()

	const company = await getCompanyByToken({ token: lookup })
	if (!company) {
		console.warn('renderPublicBookingPage: empresa nao encontrada', { lookup })
		notFound()
	}

	const calendarToken = company.token_called ?? lookup

	const calendarData = await getPublicCalendarData({ userId: company.id })
	if (!calendarData) {
		console.error('renderPublicBookingPage: dados do calendario nao carregados', {
			userId: company.id,
			lookup,
		})
		notFound()
	}

	const nextAppointmentDate = await getPublicNextAppointmentDate({
		userId: company.id,
	})

	return (
		<PublicCalendar
			companyTimes={calendarData.companyTimes}
			employees={calendarData.employees}
			services={calendarData.services}
			userId={company.id}
			token={calendarToken}
			companyName={company.be_called || 'Empresa'}
			initialDate={nextAppointmentDate}
		/>
	)
}
