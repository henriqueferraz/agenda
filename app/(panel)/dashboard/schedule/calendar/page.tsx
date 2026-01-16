/**
 * Pagina - /dashboard/schedule/calendar
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/schedule/calendar`, organizado no App Router.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCalendarData } from './_data-access/get-calendar-data'
import { getNextAppointmentDate } from './_data-access/get-next-appointment-date'
import { ModelCalendar } from './_components/model_calendar'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
 * -  Marcação de dias com agendamentos
 * -  Marcação de feriados (em vermelho)
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
