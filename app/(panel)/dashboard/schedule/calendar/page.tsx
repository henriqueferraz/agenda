/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Pagina Server - /dashboard/schedule/calendar
 *
 * Carrega horarios da empresa, funcionarios, servicos e proxima data de
 * agendamento, renderizando o calendario mensal interativo com agenda diaria.
 *
 * @example
 * // Rota acessada via navegacao no painel
 * // /dashboard/schedule/calendar
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCalendarData } from './_data-access/get-calendar-data'
import { getNextAppointmentDate } from './_data-access/get-next-appointment-date'
import { ModelCalendar } from './_components/model-calendar'
/**
 *  Página de Calendário e Agenda
 *
 * Página server que carrega os dados necessários para o calendário e sistema
 * de agendamentos. Permite ao usuário visualizar, criar e gerenciar agendamentos
 * através de um calendário mensal interativo e agenda diária detalhada.
 *
 * ## Funcionalidades
 * -  Visualização de calendário mensal
 * -  Agenda diária com agendamentos
 * -  Criação de novos agendamentos
 * -  Visualização de horários disponíveis
 * -  Marcação de feriados (em vermelho)
 * -  Bloqueio de dias sem funcionamento
 * -  Navegação entre meses e dias
 *
 * ## Dados Carregados
 * - **Horários de funcionamento**: Horários da empresa por dia da semana
 * - **Funcionários**: Lista de funcionários ativos com horários e serviços
 * - **Serviços**: Lista de serviços ativos da empresa
 * - **Próxima data**: Data do próximo agendamento para inicialização
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Redireciona se não autenticado
 *
 * 2.  Carregamento de Dados
 *    └── Busca horários, funcionários e serviços
 *
 * 3.  Busca de Próxima Data
 *    └── Encontra próximo agendamento para inicializar
 *
 * 4.  Renderização
 *    └── Componente ModelCalendar com todos os dados
 * ```
 *
 * ## Componentes Utilizados
 * - **ModelCalendar**: Componente principal do calendário
 * - **MonthlyCalendar**: Calendário mensal interativo
 * - **DailySchedule**: Agenda diária com agendamentos
 * - **AppointmentModal**: Modal para criação de agendamentos
 *
 * ## Tratamento de Erros
 * - **Não autenticado**: Redireciona para página de login
 * - **Dados não carregados**: Redireciona para dashboard
 * - **Erros de carregamento**: Tratados nos componentes de data access
 *
 * @see {@link getCalendarData} - Função de data access
 * @see {@link getNextAppointmentDate} - Função de data access
 * @see {@link ModelCalendar} - Componente principal
 */
export const CalendarPage = async () => {
	// Verificar autenticação
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}
	// Carregar dados do calendário
	const calendarData = await getCalendarData({ userId: user.id })
	// Verificar se os dados foram carregados corretamente
	if (!calendarData) {
		redirect('/')
	}
	// Buscar próxima data de agendamento para inicializar a agenda
	const nextAppointmentDate = await getNextAppointmentDate({ userId: user.id })
	return (
		<ModelCalendar
			companyTimes={calendarData.companyTimes}
			employees={calendarData.employees}
			services={calendarData.services}
			userId={user.id}
			initialDate={nextAppointmentDate}
		/>
	)
}

export default CalendarPage
