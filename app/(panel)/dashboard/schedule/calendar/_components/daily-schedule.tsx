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
import { useRouter } from 'next/navigation'
import { Clock, Calendar, User, Briefcase, Pencil, RefreshCw, X } from 'lucide-react'
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
import { getAppointmentById } from '../_data-access/get-appointment-by-id'
import { CancelAppointmentDialog } from './cancel-appointment-dialog'
import { RescheduleAppointmentDialog } from './reschedule-appointment-dialog'
import { EditAppointmentDialog } from './edit-appointment-dialog'
import { AppointmentDetailModal } from './appointment-detail-modal'
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
/** Agendamento do dia com cliente, horário, serviço, funcionário e status (F-02). */
interface Appointment {
	id: string
	name: string
	email: string
	phone: string
	time: string
	appointmentDate: Date
	status: string
	cancelReason: string | null
	service: Service
	employee: {
		id: string
		name: string
	}
}
/** Serviço disponível na empresa (para o dialog de edição). */
interface ServiceOption {
	id: string
	name: string
	duration: number
	price: number
}
/** Funcionário disponível na empresa (para o dialog de edição). */
interface EmployeeOption {
	id: string
	name: string
	serviceIds: string[]
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
	/** Serviços ativos da empresa (para dialog de edição F-02). */
	services?: ServiceOption[]
	/** Funcionários ativos da empresa (para dialog de edição F-02). */
	employees?: EmployeeOption[]
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
	services = [],
	employees = [],
}: DailyScheduleProps) => {
	const router = useRouter()
	const [appointments, setAppointments] = useState<Appointment[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingDates, setIsLoadingDates] = useState(false)
	const [availableDates, setAvailableDates] = useState<Date[]>([])
	const [selectedDate, setSelectedDate] = useState<Date>(date)
	const [detailOpen, setDetailOpen] = useState(false)
	const [cancelOpen, setCancelOpen] = useState(false)
	const [rescheduleOpen, setRescheduleOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
	const [appointmentDetail, setAppointmentDetail] = useState<Awaited<ReturnType<typeof getAppointmentById>>>(null)
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
	const handleCardClick = async (appointment: Appointment): Promise<void> => {
		setSelectedAppointment(appointment)
		const detail = await getAppointmentById({
			appointmentId: appointment.id,
			userId,
		})
		setAppointmentDetail(detail)
		setDetailOpen(true)
	}

	const handleActionSuccess = (): void => {
		router.refresh()
		loadAppointments()
		loadAvailableDates()
	}

	const openCancel = (appointment: Appointment): void => {
		setSelectedAppointment(appointment)
		setCancelOpen(true)
	}

	const openReschedule = (appointment: Appointment): void => {
		setSelectedAppointment(appointment)
		setRescheduleOpen(true)
	}

	const openEdit = (appointment: Appointment): void => {
		setSelectedAppointment(appointment)
		setEditOpen(true)
	}

	const handleDetailEdit = (): void => {
		setDetailOpen(false)
		if (selectedAppointment) openEdit(selectedAppointment)
	}

	const handleDetailReschedule = (): void => {
		setDetailOpen(false)
		if (selectedAppointment) openReschedule(selectedAppointment)
	}

	const handleDetailCancel = (): void => {
		setDetailOpen(false)
		if (selectedAppointment) openCancel(selectedAppointment)
	}

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
							{sortedAppointments.map((appointment) => {
								const isCancelled = appointment.status === 'cancelled'
								return (
									<div
										key={appointment.id}
										role="button"
										tabIndex={0}
										aria-label={`Ver detalhes do agendamento de ${appointment.name} às ${appointment.time}`}
										className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
											isCancelled
												? 'bg-red-50 border-red-200 hover:bg-red-100'
												: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
										}`}
										onClick={() => handleCardClick(appointment)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												handleCardClick(appointment)
											}
										}}
									>
										<div className='flex items-start justify-between mb-2'>
											<div className='flex-1'>
												<div className='flex items-center gap-2 mb-2'>
													<Badge variant='outline' className='bg-white'>
														{appointment.time}
													</Badge>
													{isCancelled && (
														<Badge variant='destructive' className='text-xs'>
															Cancelado
														</Badge>
													)}
												</div>
												<h4 className={`font-semibold text-sm mb-1 ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
													{appointment.name}
												</h4>
												<div className='space-y-1 text-xs text-muted-foreground'>
													<p className='flex items-center gap-1'>
														<User className='h-3 w-3' />
														{appointment.employee.name}
													</p>
													<p className={`flex items-center gap-1 ${isCancelled ? 'line-through' : ''}`}>
														<Briefcase className='h-3 w-3' />
														{appointment.service.name}
													</p>
													<p>{formatCurrency(appointment.service.price)}</p>
													<p>Duração: {appointment.service.duration} minutos</p>
												</div>
											</div>
											{!isCancelled && (
												<div className='flex gap-1 ml-2'>
													<button
														type="button"
														onClick={(e) => { e.stopPropagation(); openEdit(appointment) }}
														className='min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md hover:bg-blue-200 transition-colors'
														aria-label={`Editar agendamento de ${appointment.name}`}
													>
														<Pencil className='h-4 w-4 text-blue-700' />
													</button>
													<button
														type="button"
														onClick={(e) => { e.stopPropagation(); openReschedule(appointment) }}
														className='min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md hover:bg-blue-200 transition-colors'
														aria-label={`Reagendar agendamento de ${appointment.name}`}
													>
														<RefreshCw className='h-4 w-4 text-blue-700' />
													</button>
													<button
														type="button"
														onClick={(e) => { e.stopPropagation(); openCancel(appointment) }}
														className='min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md hover:bg-red-200 transition-colors'
														aria-label={`Cancelar agendamento de ${appointment.name}`}
													>
														<X className='h-4 w-4 text-red-600' />
													</button>
												</div>
											)}
										</div>
										<div className={`mt-2 pt-2 border-t ${isCancelled ? 'border-red-300' : 'border-blue-300'}`}>
											<p className='text-xs text-muted-foreground'>
												{appointment.email}
											</p>
											<p className='text-xs text-muted-foreground'>
												{appointment.phone}
											</p>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</div>
			</CardContent>

			{/* Modais F-02 */}
			<AppointmentDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				appointment={appointmentDetail ? {
					id: appointmentDetail.id,
					name: appointmentDetail.name,
					email: appointmentDetail.email,
					phone: appointmentDetail.phone,
					appointmentDate: appointmentDetail.appointmentDate,
					time: appointmentDetail.time,
					status: appointmentDetail.status,
					cancelReason: appointmentDetail.cancelReason,
					service: appointmentDetail.service,
					employee: appointmentDetail.employee,
					history: appointmentDetail.history.map((h) => ({
						id: h.id,
						action: h.action,
						performedBy: h.performedBy,
						changes: h.changes as Record<string, { from: unknown; to: unknown }> | null,
						reason: h.reason,
						createdAt: h.createdAt,
					})),
				} : null}
				onEdit={handleDetailEdit}
				onReschedule={handleDetailReschedule}
				onCancel={handleDetailCancel}
			/>

			{selectedAppointment && (
				<>
					<CancelAppointmentDialog
						open={cancelOpen}
						onOpenChange={setCancelOpen}
						appointment={{
							id: selectedAppointment.id,
							name: selectedAppointment.name,
							time: selectedAppointment.time,
							serviceName: selectedAppointment.service.name,
							employeeName: selectedAppointment.employee.name,
						}}
						onSuccess={handleActionSuccess}
					/>

					<RescheduleAppointmentDialog
						open={rescheduleOpen}
						onOpenChange={setRescheduleOpen}
						appointment={{
							id: selectedAppointment.id,
							name: selectedAppointment.name,
							currentDate: selectedDate
								? selectedDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
								: '',
							currentTime: selectedAppointment.time,
							serviceName: selectedAppointment.service.name,
							employeeId: selectedAppointment.employee.id,
							serviceDuration: selectedAppointment.service.duration,
						}}
						userId={userId}
						companyTimes={companyTimes}
						onSuccess={handleActionSuccess}
					/>

					<EditAppointmentDialog
						open={editOpen}
						onOpenChange={setEditOpen}
						appointment={{
							id: selectedAppointment.id,
							name: selectedAppointment.name,
							serviceId: selectedAppointment.service.id,
							employeeId: selectedAppointment.employee.id,
							currentDateStr: selectedDate
								? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
								: '',
							currentTime: selectedAppointment.time,
						}}
						services={services}
						employees={employees}
						userId={userId}
						companyTimes={companyTimes}
						onSuccess={handleActionSuccess}
					/>
				</>
			)}
		</Card>
	)
}
