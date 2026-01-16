/**
 * Componente - Public Calendar
 *
 * Visao geral:
 * - Componente React para Public Calendar.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Renderizar UI com props previsiveis.
 * - Isolar estilos e comportamento do componente.
 * - Facilitar reutilizacao em outras telas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(public)/agendamento/[token]/_components/public-calendar";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { useState } from 'react'
import { MonthlyCalendar } from '@/app/(panel)/dashboard/schedule/calendar/_components/monthly-calendar'
import { PublicAppointmentModal } from './public-appointment-modal'
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	compareDatesInSaoPaulo,
} from '@/utils/date-timezone'
import { getStopDayByDate } from '@/app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday-by-date'
import { toast } from 'sonner'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
/**
 *  Componente Principal do Calendário Público
 *
 * Componente React cliente que orquestra a exibição do calendário mensal
 * e modal de agendamento para acesso público (sem autenticação).
 * Versão simplificada do ModelCalendar sem sidebar, breadcrumb e agenda diária.
 *
 * ## Funcionalidades
 * -  **Calendário mensal**: Visualização e seleção de datas
 * -  **Modal de agendamento**: Criação de novos agendamentos (público)
 * -  **Verificação de feriados**: Impede agendamentos em dias de feriado
 * -  **Validação de datas**: Não permite datas passadas
 * -  **Layout responsivo**: Adaptável desktop/mobile
 * -  **Layout público**: Sem sidebar, header simplificado
 * -  **Apenas calendário**: Agenda diária removida (uso interno apenas)
 *
 * @param props - Propriedades do componente
 * @returns JSX.Element - Interface completa do calendário público
 */
interface CompanyTimes {
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
}
interface Service {
	id: string
	name: string
	price: number
	duration: number
	status: boolean
}
interface EmployeeService {
	id: string
	service: Service
}
interface Employee {
	id: string
	name: string
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
	services: EmployeeService[]
}
interface PublicCalendarProps {
	companyTimes: CompanyTimes | null
	employees: Employee[]
	services: Service[]
	userId: string
	token: string
	companyName: string
	initialDate?: Date | null
}
export const PublicCalendar = ({
	companyTimes,
	employees,
	services,
	userId,
	token,
	companyName,
	initialDate,
}: PublicCalendarProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const [selectedDate, setSelectedDate] = useState<Date | null>(
		initialDate || null,
	)
	const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
	const [appointmentDate, setAppointmentDate] = useState<Date | null>(null)
	const handleDateSelect = async (date: Date) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		// Verifica se a data não é passada (usando timezone America/Sao_Paulo)
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		const selectedDay = startOfDayInSaoPaulo(date)
		if (compareDatesInSaoPaulo(selectedDay, today) < 0) {
			// Não permite abrir modal para datas passadas
			toast.error('Não é possível agendar em datas passadas.')
			return
		}
		// Verifica se é feriado ANTES de abrir o modal
		try {
			const stopDay = await getStopDayByDate({ userId, date })
			if (stopDay) {
				toast.error(`Empresa fechada neste dia. Motivo: ${stopDay.motivation}`)
				return
			}
		} catch (error) {
			console.error('Erro ao verificar feriado:', error)
			// Em caso de erro, permite abrir o modal (o modal também verifica)
		}
		setSelectedDate(date)
		// Abre o modal de agendamento quando clica em um dia
		setAppointmentDate(date)
		setIsAppointmentModalOpen(true)
	}
	return (
		<div className='min-h-screen bg-background'>
			{/* Header simplificado */}
			<header className='border-b bg-card'>
				<div className='container mx-auto px-4 py-4'>
					<h1 className='text-2xl font-bold'>Agendamento - {companyName}</h1>
					<p className='text-sm text-muted-foreground mt-1'>
						Selecione uma data para agendar seu serviço
					</p>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className='container mx-auto px-4 py-6'>
				<div className='max-w-4xl mx-auto'>
					{/* Calendário Mensal */}
					<MonthlyCalendar
						selectedDate={selectedDate}
						onDateSelect={handleDateSelect}
						userId={userId}
					/>
				</div>
			</div>

			{/* Modal de Agendamento */}
			{appointmentDate && (
				<PublicAppointmentModal
					open={isAppointmentModalOpen}
					onOpenChange={setIsAppointmentModalOpen}
					date={appointmentDate}
					companyTimes={companyTimes}
					employees={employees}
					services={services}
					userId={userId}
					token={token}
				/>
			)}
		</div>
	)
}
