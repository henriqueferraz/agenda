/**
 * Componente - Model Calendar
 *
 * Visao geral:
 * - Componente React para Model Calendar.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_components/model_calendar";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { useState } from 'react'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { MonthlyCalendar } from './monthly-calendar'
import { DailySchedule } from './daily-schedule'
import { AppointmentModal } from './appointment-modal'
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	compareDatesInSaoPaulo,
} from '@/utils/date-timezone'
import { getStopDayByDate } from '../../stopday/_data-access/get-stopday-by-date'
import { toast } from 'sonner'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
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
interface ModelCalendarProps {
	companyTimes: CompanyTimes | null
	employees: Employee[]
	services: Service[]
	userId: string
	initialDate?: Date | null
}
export const ModelCalendar = ({
	companyTimes,
	employees,
	services,
	userId,
	initialDate,
}: ModelCalendarProps) => {
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
		<SidebarInset>
			{/* Cabeçalho com navegação breadcrumb */}
			<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
				<div className='flex items-center gap-2 px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator
						orientation='vertical'
						className='mr-2 data-[orientation=vertical]:h-4'
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href='/dashboard/schedule/calendar'>
									Agendamentos
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Agenda</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className='flex flex-col gap-6 p-4 sm:p-6 md:p-8'>
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{/* Calendário Mensal */}
					<div>
						<MonthlyCalendar
							selectedDate={selectedDate}
							onDateSelect={handleDateSelect}
							userId={userId}
						/>
					</div>

					{/* Agenda Diária */}
					<div>
						<DailySchedule
							date={selectedDate || new Date()}
							onDateChange={(newDate) => {
								setSelectedDate(newDate)
							}}
							userId={userId}
						/>
					</div>
				</div>
			</div>

			{/* Modal de Agendamento */}
			{appointmentDate && (
				<AppointmentModal
					open={isAppointmentModalOpen}
					onOpenChange={setIsAppointmentModalOpen}
					date={appointmentDate}
					companyTimes={companyTimes}
					employees={employees}
					services={services}
					userId={userId}
				/>
			)}
		</SidebarInset>
	)
}
