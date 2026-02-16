/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Layout da página de agenda: calendário mensal, agenda diária e modal de agendamento.
 * Orquestra MonthlyCalendar, DailySchedule e AppointmentModal; valida data passada e
 * feriado antes de abrir o modal.
 *
 * @example
 * ```tsx
 * <ModelCalendar companyTimes={...} employees={...} services={...} userId={...} />
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
/** Horários de funcionamento por dia da semana. */
interface CompanyTimes {
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
}
/** Serviço oferecido (preço em centavos, duração em minutos). */
interface Service {
	id: string
	name: string
	price: number
	duration: number
	status: boolean
}
/** Vínculo funcionário-serviço. */
interface EmployeeService {
	id: string
	service: Service
}
/** Funcionário com horários por dia e serviços vinculados. */
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
/** Props do componente ModelCalendar. */
interface ModelCalendarProps {
	/** Horários da empresa por dia da semana (null se não configurado). */
	companyTimes: CompanyTimes | null
	/** Lista de funcionários com horários e serviços. */
	employees: Employee[]
	/** Lista de serviços disponíveis. */
	services: Service[]
	/** ID do usuário (empresa). */
	userId: string
	/** Data inicial selecionada (opcional). */
	initialDate?: Date | null
}
/**
 * Página de agenda com calendário mensal, agenda do dia e modal de novo agendamento.
 * @param props - companyTimes, employees, services, userId, initialDate
 * @returns JSX com SidebarInset, breadcrumb, grid e AppointmentModal
 */
export const ModelCalendar = ({
	companyTimes,
	employees,
	services,
	userId,
	initialDate,
}: ModelCalendarProps) => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(
		initialDate || null,
	)
	const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
	const [appointmentDate, setAppointmentDate] = useState<Date | null>(null)
	const handleDateSelect = async (date: Date) => {
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
							companyTimes={companyTimes}
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
							companyTimes={companyTimes}
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
