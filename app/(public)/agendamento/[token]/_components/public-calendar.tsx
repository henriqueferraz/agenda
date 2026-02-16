/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Calendário público de agendamento. Orquestra o calendário mensal e o modal de
 * agendamento para acesso sem autenticação. Verifica feriados e dias fechados,
 * bloqueia datas passadas e exibe layout simplificado (sem sidebar/agenda diária).
 *
 * @example
 * <PublicCalendar
 *   companyTimes={companyTimes}
 *   employees={employees}
 *   services={services}
 *   userId={userId}
 *   token={token}
 *   companyName={companyName}
 *   initialDate={date}
 * />
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
/**
 * Props do componente PublicCalendar.
 */
interface PublicCalendarProps {
	/** Horários de funcionamento por dia da semana */
	companyTimes: CompanyTimes | null
	/** Lista de funcionários com serviços e horários */
	employees: Employee[]
	/** Serviços disponíveis */
	services: Service[]
	/** ID do usuário (empresa) para consultas e feriados */
	userId: string
	/** Token único da empresa para criar agendamento público */
	token: string
	/** Nome da empresa exibido no header */
	companyName: string
	/** Data inicial opcional do calendário */
	initialDate?: Date | null
}
/**
 * Calendário público: exibe calendário mensal e abre modal de agendamento ao clicar na data.
 *
 * @param props - companyTimes, employees, services, userId, token, companyName, initialDate
 * @returns JSX.Element
 */
export const PublicCalendar = ({
	companyTimes,
	employees,
	services,
	userId,
	token,
	companyName,
	initialDate,
}: PublicCalendarProps) => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(
		initialDate || null,
	)
	const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
	const [appointmentDate, setAppointmentDate] = useState<Date | null>(null)
	const isCompanyClosed = (date: Date): boolean => {
		if (!companyTimes) return false
		const weekday = date.getDay()
		const timesByWeekday: Record<number, string[]> = {
			0: companyTimes.sun_times,
			1: companyTimes.mon_times,
			2: companyTimes.tue_times,
			3: companyTimes.wed_times,
			4: companyTimes.thu_times,
			5: companyTimes.fri_times,
			6: companyTimes.sat_times,
		}
		const times = timesByWeekday[weekday] ?? []
		return times.length === 0
	}
	const handleDateSelect = async (date: Date) => {
		// Verifica se a data não é passada (usando timezone America/Sao_Paulo)
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		const selectedDay = startOfDayInSaoPaulo(date)
		if (compareDatesInSaoPaulo(selectedDay, today) < 0) {
			// Não permite abrir modal para datas passadas
			toast.error('Não é possível agendar em datas passadas.')
			return
		}
		if (isCompanyClosed(date)) {
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
						companyTimes={companyTimes}
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
