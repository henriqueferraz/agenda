/**
 * Pagina - /agendamento/[token]
 *
 * Visao geral:
 * - Componente de pagina para a rota `/agendamento/[token]`, organizado no App Router.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Orquestrar a composicao visual da rota.
 * - Disparar carregamentos de dados quando necessario.
 * - Renderizar estados de sucesso e erro.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(public)/agendamento/[token]/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { notFound } from 'next/navigation'
import { getCompanyByToken } from './_data-access/get-company-by-token'
import { getCalendarData } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-calendar-data'
import { getNextAppointmentDate } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-next-appointment-date'
import { PublicCalendar } from './_components/public-calendar'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
 * -  Marcação de dias com agendamentos
 * -  Marcação de feriados (em vermelho)
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
