/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Página pública de agendamento (rota `/agendamento/[token]`).
 * Server Component que busca empresa pelo token, carrega horários/funcionários/serviços
 * e próxima data; renderiza PublicCalendar para o cliente agendar sem login. Retorna 404 se token inválido.
 */
import { notFound } from 'next/navigation'
import { getCompanyByToken } from './_data-access/get-company-by-token'
import { getPublicCalendarData } from './_data-access/get-public-calendar-data'
import { getPublicNextAppointmentDate } from './_data-access/get-public-next-appointment-date'
import { PublicCalendar } from './_components/public-calendar'

// Força renderização dinâmica para garantir que a rota seja processada corretamente
export const dynamic = 'force-dynamic'
export const dynamicParams = true
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
	// Log imediato para verificar se a página está sendo chamada
	console.log('PublicBookingPage: Página iniciada', {
		timestamp: new Date().toISOString(),
		userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
	})
	
	const { token: rawToken } = await params
	
	// Validação básica do token antes de buscar
	if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
		console.warn('PublicBookingPage: Token vazio ou inválido', { rawToken })
		notFound()
	}
	
	// Remove qualquer query string que possa ter sido incluída no token (proteção extra)
	let cleanToken = rawToken.split('?')[0].split('#')[0]
	
	// Decodifica a URL caso tenha sido codificada (ex: %20 para espaço)
	let decodedToken = cleanToken
	try {
		decodedToken = decodeURIComponent(cleanToken)
	} catch {
		// Se falhar, usa o token original
		decodedToken = cleanToken
	}
	
	// Sanitiza o token: remove espaços e normaliza para minúsculas
	// IMPORTANTE: Não remove hífens pois fazem parte do formato do token (slug-hash)
	const token = decodedToken.trim().toLowerCase()
	
	// Log sempre em produção para debug do problema
	console.log('PublicBookingPage: Processando token', {
		rawToken,
		rawTokenType: typeof rawToken,
		rawTokenLength: rawToken?.length,
		cleanToken,
		decodedToken,
		sanitizedToken: token,
		tokenLength: token.length,
		firstChars: token.slice(0, 30),
		lastChars: token.slice(-10),
	})
	
	// Verificar se o token existe e buscar empresa
	const company = await getCompanyByToken({ token })
	if (!company) {
		// Log detalhado para debug em produção também
		console.error('PublicBookingPage: Token não encontrado', {
			rawToken,
			decodedToken,
			sanitizedToken: token,
			tokenLength: token.length,
			firstChars: token.slice(0, 30),
		})
		notFound()
	}
	
	// Carregar dados do calendário usando o userId da empresa (versão pública, sem autenticação)
	const calendarData = await getPublicCalendarData({ userId: company.id })
	// Verificar se os dados foram carregados corretamente
	if (!calendarData) {
		console.error('PublicBookingPage: Dados do calendário não carregados', {
			userId: company.id,
			token,
		})
		notFound()
	}
	// Buscar próxima data de agendamento para inicializar a agenda (versão pública, sem autenticação)
	const nextAppointmentDate = await getPublicNextAppointmentDate({
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
