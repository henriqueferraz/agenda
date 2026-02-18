/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Componente de fluxo de reagendamento (F-08). Permite ao cliente escolher
 * nova data e horário disponível. Exibe calendário mensal simplificado
 * e grid de horários disponíveis, reutilizando a lógica de disponibilidade.
 *
 * @example
 * <RescheduleFlow
 *   appointment={appointment}
 *   onConfirm={(date, time) => handleReschedule(date, time)}
 *   onCancel={() => setShowReschedule(false)}
 *   isPending={false}
 * />
 */
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import {
	ChevronLeft,
	ChevronRight,
	ArrowLeft,
	Clock,
	Loader2,
	CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ManagementAppointmentData } from '../_data-access/get-appointment-by-management-token'
import { getAvailableTimesForReschedule } from '../_data-access/get-available-times'

/** Props do RescheduleFlow. */
interface RescheduleFlowProps {
	/** Dados do agendamento atual. */
	appointment: ManagementAppointmentData
	/** Callback quando o cliente confirma novo horário. */
	onConfirm: (newDate: Date, newTime: string) => void
	/** Callback para voltar à tela anterior. */
	onCancel: () => void
	/** Indica se a ação está sendo processada. */
	isPending: boolean
}

/** Nomes dos meses em português. */
const MONTHS = [
	'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
	'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Nomes abreviados dos dias da semana. */
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * Fluxo completo de reagendamento: calendário + horários + confirmação.
 * Etapa 1: selecionar nova data no calendário mensal.
 * Etapa 2: selecionar horário disponível no grid.
 * Etapa 3: confirmar reagendamento.
 *
 * @param props - appointment, onConfirm, onCancel, isPending
 * @returns JSX.Element
 */
export const RescheduleFlow = ({
	appointment,
	onConfirm,
	onCancel,
	isPending,
}: RescheduleFlowProps): React.ReactElement => {
	const today = new Date()
	const [currentMonth, setCurrentMonth] = useState(today.getMonth())
	const [currentYear, setCurrentYear] = useState(today.getFullYear())
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [selectedTime, setSelectedTime] = useState<string | null>(null)
	const [availableTimes, setAvailableTimes] = useState<string[]>([])
	const [loadingTimes, setLoadingTimes] = useState(false)

	const fetchTimes = useCallback(async (date: Date) => {
		setLoadingTimes(true)
		setAvailableTimes([])
		setSelectedTime(null)
		try {
			const times = await getAvailableTimesForReschedule({
				userId: appointment.userId,
				date,
				employeeId: appointment.employee.id,
				serviceId: appointment.service.id,
				excludeAppointmentId: appointment.id,
			})
			setAvailableTimes(times)
		} catch {
			setAvailableTimes([])
		} finally {
			setLoadingTimes(false)
		}
	}, [appointment])

	useEffect(() => {
		if (selectedDate) {
			fetchTimes(selectedDate)
		}
	}, [selectedDate, fetchTimes])

	const handlePrevMonth = (): void => {
		if (currentMonth === 0) {
			setCurrentMonth(11)
			setCurrentYear((prev) => prev - 1)
		} else {
			setCurrentMonth((prev) => prev - 1)
		}
	}

	const handleNextMonth = (): void => {
		if (currentMonth === 11) {
			setCurrentMonth(0)
			setCurrentYear((prev) => prev + 1)
		} else {
			setCurrentMonth((prev) => prev + 1)
		}
	}

	const handleDateClick = (day: number): void => {
		const date = new Date(currentYear, currentMonth, day)
		setSelectedDate(date)
	}

	const handleConfirm = (): void => {
		if (selectedDate && selectedTime) {
			onConfirm(selectedDate, selectedTime)
		}
	}

	const getDaysInMonth = (month: number, year: number): number =>
		new Date(year, month + 1, 0).getDate()

	const getFirstDayOfMonth = (month: number, year: number): number =>
		new Date(year, month, 1).getDay()

	const isPastDay = (day: number): boolean => {
		const date = new Date(currentYear, currentMonth, day)
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
		return date < todayStart
	}

	const isSelected = (day: number): boolean => {
		if (!selectedDate) return false
		return (
			selectedDate.getDate() === day &&
			selectedDate.getMonth() === currentMonth &&
			selectedDate.getFullYear() === currentYear
		)
	}

	const isToday = (day: number): boolean =>
		day === today.getDate() &&
		currentMonth === today.getMonth() &&
		currentYear === today.getFullYear()

	const isPrevDisabled =
		currentMonth === today.getMonth() && currentYear === today.getFullYear()

	const daysInMonth = getDaysInMonth(currentMonth, currentYear)
	const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<Card className="w-full max-w-lg shadow-lg">
				<CardHeader className="pb-3 sm:pb-4">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={onCancel}
							className="min-h-[44px] min-w-[44px]"
							aria-label="Voltar"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<CardTitle className="text-lg font-bold text-gray-900 sm:text-xl">
							Reagendar
						</CardTitle>
					</div>
					<p className="pl-12 text-sm text-gray-500">
						{appointment.service.name} com {appointment.employee.name}
					</p>
				</CardHeader>

				<CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
					<div className="rounded-xl border bg-white p-3 sm:p-4">
						<div className="mb-3 flex items-center justify-between">
							<Button
								variant="ghost"
								size="icon"
								onClick={handlePrevMonth}
								disabled={isPrevDisabled}
								className="min-h-[44px] min-w-[44px]"
								aria-label="Mês anterior"
							>
								<ChevronLeft className="h-5 w-5" />
							</Button>
							<span className="text-sm font-semibold text-gray-900 sm:text-base">
								{MONTHS[currentMonth]} {currentYear}
							</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleNextMonth}
								className="min-h-[44px] min-w-[44px]"
								aria-label="Próximo mês"
							>
								<ChevronRight className="h-5 w-5" />
							</Button>
						</div>

						<div className="mb-1 grid grid-cols-7 gap-1">
							{WEEKDAYS.map((day) => (
								<div
									key={day}
									className="text-center text-xs font-medium text-gray-500"
								>
									{day}
								</div>
							))}
						</div>

						<div className="grid grid-cols-7 gap-1">
							{Array.from({ length: firstDay }).map((_, i) => (
								<div key={`empty-${i}`} />
							))}
							{Array.from({ length: daysInMonth }).map((_, i) => {
								const day = i + 1
								const past = isPastDay(day)
								const selected = isSelected(day)
								const todayMark = isToday(day)

								return (
									<button
										key={day}
										type="button"
										disabled={past}
										onClick={() => handleDateClick(day)}
										className={cn(
											'flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors sm:h-10',
											past && 'cursor-not-allowed text-gray-300',
											!past && !selected && 'hover:bg-blue-50 text-gray-700',
											selected && 'bg-blue-600 text-white font-semibold',
											todayMark && !selected && 'font-bold text-blue-600 ring-1 ring-blue-300',
										)}
										aria-label={`Selecionar dia ${day}`}
									>
										{day}
									</button>
								)
							})}
						</div>
					</div>

					{selectedDate && (
						<div className="rounded-xl border bg-white p-3 sm:p-4">
							<div className="mb-3 flex items-center gap-2">
								<Clock className="h-4 w-4 text-blue-600" />
								<span className="text-sm font-semibold text-gray-900">
									Horários disponíveis
								</span>
							</div>

							{loadingTimes ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
								</div>
							) : availableTimes.length === 0 ? (
								<p className="py-4 text-center text-sm text-gray-500">
									Nenhum horário disponível nesta data.
								</p>
							) : (
								<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
									{availableTimes.map((time) => (
										<button
											key={time}
											type="button"
											onClick={() => setSelectedTime(time)}
											className={cn(
												'min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
												selectedTime === time
													? 'border-blue-600 bg-blue-600 text-white'
													: 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50',
											)}
											aria-label={`Selecionar horário ${time}`}
										>
											{time}
										</button>
									))}
								</div>
							)}
						</div>
					)}

					{selectedDate && selectedTime && (
						<Button
							className="min-h-[44px] w-full bg-blue-600 hover:bg-blue-700"
							onClick={handleConfirm}
							disabled={isPending}
							aria-label="Confirmar reagendamento"
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Reagendando...
								</>
							) : (
								<>
									<CalendarClock className="mr-2 h-4 w-4" />
									Confirmar reagendamento
								</>
							)}
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
