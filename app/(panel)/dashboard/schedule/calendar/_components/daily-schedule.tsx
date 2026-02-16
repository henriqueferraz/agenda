/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Card de agenda diária: seletor de data (datas disponíveis) e lista de agendamentos do dia.
 * Carrega datas via getAppointmentDates, filtra por feriados e horário da empresa; lista
 * agendamentos via getDayAppointments; timezone America/Sao_Paulo.
 *
 * @example
 * ```tsx
 * <DailySchedule date={selectedDate} onDateChange={setSelectedDate} companyTimes={...} userId={...} />
 * ```
 */
'use client'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { Clock, Calendar, User, Briefcase } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { getDayAppointments } from '../_data-access/get-day-appointments'
import { getAppointmentDates } from '../_data-access/get-appointment-dates'
import { getMonthStopDays } from '../_data-access/get-month-stopdays'
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	formatDateInSaoPaulo,
	createDateInSaoPaulo,
} from '@/utils/date-timezone'
/** Serviço do agendamento (preço, duração). */
interface Service {
	id: string
	name: string
	price: number
	duration: number
	status: boolean
}
/** Agendamento do dia com cliente, horário, serviço e funcionário. */
interface Appointment {
	id: string
	name: string
	email: string
	phone: string
	time: string
	service: Service
	employee: {
		id: string
		name: string
	}
}
/** Props do componente DailySchedule. */
interface DailyScheduleProps {
	/** Data atualmente exibida. */
	date: Date
	/** Callback quando o usuário troca a data no seletor. */
	onDateChange?: (date: Date) => void
	/** Horários de funcionamento da empresa por dia da semana. */
	companyTimes: CompanyTimes | null
	/** ID do usuário (empresa). */
	userId: string
}
/** Horários por dia da semana. */
interface CompanyTimes {
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
}
/**
 * Agenda do dia: seletor de data e lista de agendamentos ordenados por horário.
 * @param props - date, onDateChange, companyTimes, userId
 * @returns JSX do Card com seletor e lista
 */
export const DailySchedule = ({
	date,
	onDateChange,
	companyTimes,
	userId,
}: DailyScheduleProps) => {
	const [appointments, setAppointments] = useState<Appointment[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingDates, setIsLoadingDates] = useState(false)
	const [availableDates, setAvailableDates] = useState<Date[]>([])
	const [selectedDate, setSelectedDate] = useState<Date>(date)
	// Atualiza quando a prop date muda
	useEffect(() => {
		// Normaliza a data para evitar problemas de timezone
		const normalizedDate = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		)
		setSelectedDate(normalizedDate)
	}, [date])
	const normalizeDate = (d: Date): Date => {
		return startOfDayInSaoPaulo(d)
	}
	const formatDateForSelect = (d: Date): string => {
		const year = d.getFullYear()
		const month = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}
	const loadAvailableDates = useCallback(async () => {
		setIsLoadingDates(true)
		try {
			const dates = await getAppointmentDates({ userId })
			// Normaliza todas as datas recebidas do servidor
			const normalizedDates = dates.map(normalizeDate)
			// Remove duplicatas usando Map
			const uniqueDates = Array.from(
				new Map(normalizedDates.map((d) => [d.getTime(), d])).values(),
			)
			// Filtra apenas datas que não são passadas (usando timezone America/Sao_Paulo)
			const now = getNowInSaoPaulo()
			const today = startOfDayInSaoPaulo(now)
			const futureDates = uniqueDates
				.filter((d) => d >= today)
				.sort((a, b) => a.getTime() - b.getTime())
			// Busca e remove datas que são feriados (empresa não funciona)
			const stopDayKeys = await (async () => {
				const monthMap = new Map<string, { year: number; month: number }>()
				futureDates.forEach((d) => {
					const year = d.getFullYear()
					const month = d.getMonth()
					const key = `${year}-${month}`
					if (!monthMap.has(key)) {
						monthMap.set(key, { year, month })
					}
				})
				const monthEntries = Array.from(monthMap.values())
				const stopDaysByMonth = await Promise.all(
					monthEntries.map(({ year, month }) =>
						getMonthStopDays({ userId, year, month }),
					),
				)
				const stopDaySet = new Set<string>()
				stopDaysByMonth.forEach((stopDays, index) => {
					const { year, month } = monthEntries[index]
					stopDays.forEach((day) => {
						const stopDate = createDateInSaoPaulo(year, month, day)
						stopDaySet.add(formatDateForSelect(stopDate))
					})
				})
				return stopDaySet
			})()
		const isCompanyClosed = (d: Date): boolean => {
			if (!companyTimes) return false
			const weekday = d.getDay()
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
		const filteredDates = futureDates.filter((d) => {
			if (stopDayKeys.has(formatDateForSelect(d))) return false
			if (isCompanyClosed(d)) return false
			return true
		})
			setAvailableDates(filteredDates)
			// Normaliza a data atual para comparação
			const currentDateNormalized = normalizeDate(date)
			const isCurrentDatePast = currentDateNormalized < today
			const isCurrentDateAvailable = filteredDates.some(
				(d) => d.getTime() === currentDateNormalized.getTime(),
			)
			// Se há datas disponíveis, verifica se a data atual está disponível e não é passada
			if (filteredDates.length > 0) {
				// Se a data atual é passada ou não está disponível, seleciona a primeira data disponível
				if (isCurrentDatePast || !isCurrentDateAvailable) {
					const firstDate = filteredDates[0]
					setSelectedDate(firstDate)
					if (onDateChange) {
						onDateChange(firstDate)
					}
				} else {
					// Garante que a data selecionada está normalizada
					setSelectedDate(currentDateNormalized)
				}
			} else {
				// Se não há datas disponíveis futuras
				if (isCurrentDatePast) {
					// Se a data é passada e não há datas futuras, seleciona hoje
					setSelectedDate(today)
				} else {
					// Mantém a data atual normalizada
					setSelectedDate(currentDateNormalized)
				}
			}
		} catch (error) {
			console.error('Erro ao carregar datas disponíveis:', error)
			setAvailableDates([])
			const now = getNowInSaoPaulo()
			const today = startOfDayInSaoPaulo(now)
			setSelectedDate(today)
		} finally {
			setIsLoadingDates(false)
		}
	}, [date, onDateChange, userId, companyTimes])
	// Carrega datas disponíveis ao montar o componente
	useEffect(() => {
		loadAvailableDates()
	}, [loadAvailableDates])
	const loadAppointments = useCallback(async () => {
		setIsLoading(true)
		try {
			const apts = await getDayAppointments({ userId, date: selectedDate })
			setAppointments(apts)
		} catch (error) {
			console.error('Erro ao carregar agendamentos:', error)
			setAppointments([])
		} finally {
			setIsLoading(false)
		}
	}, [selectedDate, userId])
	// Carrega agendamentos quando a data muda
	useEffect(() => {
		if (selectedDate) {
			loadAppointments()
		}
	}, [loadAppointments, selectedDate])
	// Formata a data
	const formattedDate = useMemo(() => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}
		return formatDateInSaoPaulo(selectedDate, options)
	}, [selectedDate])
	const handleDateChange = (dateStr: string) => {
		if (dateStr) {
			// Cria data usando timezone America/Sao_Paulo
			const [year, month, day] = dateStr.split('-').map(Number)
			const newDate = createDateInSaoPaulo(year, month - 1, day)
			setSelectedDate(newDate)
			if (onDateChange) {
				onDateChange(newDate)
			}
		}
	}
	const formatDateForDisplay = (date: Date): string => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		}
		return formatDateInSaoPaulo(date, options)
	}
	// Ordena agendamentos por horário
	const sortedAppointments = useMemo(() => {
		return [...appointments].sort((a, b) => {
			const [aHours, aMinutes] = a.time.split(':').map(Number)
			const [bHours, bMinutes] = b.time.split(':').map(Number)
			if (aHours !== bHours) return aHours - bHours
			return aMinutes - bMinutes
		})
	}, [appointments])
	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						<Clock className='h-5 w-5' />
						Agenda Diária
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent className='space-y-4'>
				{/* Seletor de Data */}
				<div className='space-y-2'>
					<Label className='flex items-center gap-2'>
						<Calendar className='h-4 w-4' />
						Data
					</Label>
					{isLoadingDates ? (
						<div className='flex items-center gap-2 py-2'>
							<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
							<span className='text-sm text-muted-foreground'>
								Carregando datas disponíveis...
							</span>
						</div>
					) : availableDates.length === 0 ? (
						<p className='text-sm text-muted-foreground py-2'>
							Nenhuma data com agendamentos encontrada.
						</p>
					) : (
						<>
							<Select
								value={
									selectedDate ? formatDateForSelect(selectedDate) : undefined
								}
								onValueChange={handleDateChange}
							>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Selecione uma data' />
								</SelectTrigger>
								<SelectContent>
									{availableDates.map((dateOption) => {
										// Garante que a data está normalizada
										const normalizedOption = normalizeDate(dateOption)
										const dateKey = formatDateForSelect(normalizedOption)
										return (
											<SelectItem key={dateKey} value={dateKey}>
												{formatDateForDisplay(normalizedOption)}
											</SelectItem>
										)
									})}
								</SelectContent>
							</Select>
							{selectedDate && (
								<p className='text-sm text-muted-foreground'>{formattedDate}</p>
							)}
						</>
					)}
				</div>

				<div className='border-t pt-4'>
					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
							<span className='ml-2 text-sm text-muted-foreground'>
								Carregando agendamentos...
							</span>
						</div>
					) : sortedAppointments.length === 0 ? (
						<div className='text-center py-8'>
							<p className='text-sm text-muted-foreground'>
								Nenhum agendamento para este dia.
							</p>
						</div>
					) : (
						<div className='space-y-3'>
							<h3 className='font-semibold text-sm mb-3'>
								Agendamentos ({sortedAppointments.length})
							</h3>
							{sortedAppointments.map((appointment) => (
								<div
									key={appointment.id}
									className='p-4 rounded-lg border bg-blue-50 border-blue-200'
								>
									<div className='flex items-start justify-between mb-2'>
										<div className='flex-1'>
											<div className='flex items-center gap-2 mb-2'>
												<Badge variant='outline' className='bg-white'>
													{appointment.time}
												</Badge>
											</div>
											<h4 className='font-semibold text-sm mb-1'>
												{appointment.name}
											</h4>
											<div className='space-y-1 text-xs text-muted-foreground'>
												<p className='flex items-center gap-1'>
													<User className='h-3 w-3' />
													{appointment.employee.name}
												</p>
												<p className='flex items-center gap-1'>
													<Briefcase className='h-3 w-3' />
													{appointment.service.name}
												</p>
												<p>{formatCurrency(appointment.service.price)}</p>
												<p>Duração: {appointment.service.duration} minutos</p>
											</div>
										</div>
									</div>
									<div className='mt-2 pt-2 border-t border-blue-300'>
										<p className='text-xs text-muted-foreground'>
											{appointment.email}
										</p>
										<p className='text-xs text-muted-foreground'>
											{appointment.phone}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
