/**
 * Página pública de agendamento (rota `/agendamento/[token]`).
 * Server Component que busca empresa pelo token, carrega horários/funcionários/serviços
 * e próxima data; renderiza PublicCalendar para o cliente agendar sem login. Retorna 404 se token inválido.
 */
import { notFound } from 'next/navigation'
import { getCompanyByToken } from './_data-access/get-company-by-token'
import { getCalendarData } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-calendar-data'
import { getNextAppointmentDate } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-next-appointment-date'
import { PublicCalendar } from './_components/public-calendar'
/**
 *  Página Pública de Agendamento
 *
 * Página pública (sem autenticação) que permite aos clientes agendarem
 * serviços através de um token único gerado a partir do campo be_called
 * da empresa. Cada empresa possui um link único para sua página de agendamento.
 *
 * ## Funcionalidades
 * -  Acesso público sem necessidade de login
 * -  Visualização de calendário mensal
 * -  Criação de novos agendamentos
 * -  Visualização de horários disponíveis
 * -  Marcação de feriados (em vermelho)
 * -  Bloqueio de dias sem funcionamento
 * -  Interface simplificada (sem agenda diária - uso interno apenas)
 *
 * ## Rota
 * `/agendamento/[token]` onde `token` é o valor do campo `token_called` da empresa
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Validação de Token
 *    └── Busca empresa pelo token
 *
 * 2.  Carregamento de Dados
 *    └── Busca horários, funcionários e serviços
 *
 * 3.  Busca de Próxima Data
 *    └── Encontra próximo agendamento para inicializar
 *
 * 4.  Renderização
 *    └── Componente PublicCalendar com todos os dados
 * ```
 *
 * ## Tratamento de Erros
 * - **Token inválido**: Retorna 404 (not found)
 * - **Dados não carregados**: Retorna 404
 * - **Erros de carregamento**: Tratados nos componentes de data access
 *
 * @param params - Parâmetros da rota (token)
 * @returns JSX.Element - Página de agendamento público renderizada
 *
 * @example
 * ```tsx
 * // Acesso via URL: /agendamento/joao-abc123
 * <PublicBookingPage params={{ token: "joao-abc123" }} />
 * ```
 */
interface PublicBookingPageProps {
	params: Promise<{
		token: string
	}>
}
export const PublicBookingPage = async ({ params }: PublicBookingPageProps) => {
	const { token } = await params
	// Verificar se o token existe e buscar empresa
	const company = await getCompanyByToken({ token })
	if (!company) {
		notFound()
	}
	// Carregar dados do calendário usando o userId da empresa
	const calendarData = await getCalendarData({ userId: company.id })
	// Verificar se os dados foram carregados corretamente
	if (!calendarData) {
		notFound()
	}
	// Buscar próxima data de agendamento para inicializar a agenda
	const nextAppointmentDate = await getNextAppointmentDate({
		userId: company.id,
	})
	return (
		<PublicCalendar
			companyTimes={calendarData.companyTimes}
			employees={calendarData.employees}
			services={calendarData.services}
			userId={company.id}
			token={token}
			companyName={company.be_called || 'Empresa'}
			initialDate={nextAppointmentDate}
		/>
	)
}

export default PublicBookingPage
