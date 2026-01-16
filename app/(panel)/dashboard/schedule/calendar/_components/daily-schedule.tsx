/**
 * Componente - Daily Schedule
 *
 * Visao geral:
 * - Componente React para Daily Schedule.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_components/daily-schedule";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
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
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	formatDateInSaoPaulo,
	createDateInSaoPaulo,
} from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface Service {
	id: string
	name: string
	price: number
	duration: number
	status: boolean
}
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
interface DailyScheduleProps {
	/** Data selecionada */
	date: Date
	/** Callback quando a data é alterada */
	onDateChange?: (date: Date) => void
	/** ID do usuário (empresa) */
	userId: string
}
export const DailySchedule = ({
	date,
	onDateChange,
	userId,
}: DailyScheduleProps) => {
	// Passo 1: inicializar estados locais da agenda diaria.
	// Passo 2: preparar efeitos para carregar datas e agendamentos.
	// Passo 3: expor handlers para trocar datas.
	// Passo 4: renderizar lista e estados de carregamento.
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
	// Função auxiliar para normalizar datas (remove hora, minutos, segundos) no timezone America/Sao_Paulo
	const normalizeDate = (d: Date): Date => {
		// Passo 1: receber a data informada pelo caller.
		// Passo 2: normalizar para o inicio do dia no timezone correto.
		return startOfDayInSaoPaulo(d)
	}
	const loadAvailableDates = useCallback(async () => {
		// Passo 1: marcar carregamento e validar dependencias.
		// Passo 2: buscar datas disponiveis e normalizar resultados.
		// Passo 3: ajustar data selecionada conforme disponibilidade.
		// Passo 4: finalizar loading e tratar erros.
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
			setAvailableDates(futureDates)
			// Normaliza a data atual para comparação
			const currentDateNormalized = normalizeDate(date)
			const isCurrentDatePast = currentDateNormalized < today
			const isCurrentDateAvailable = futureDates.some(
				(d) => d.getTime() === currentDateNormalized.getTime(),
			)
			// Se há datas disponíveis, verifica se a data atual está disponível e não é passada
			if (futureDates.length > 0) {
				// Se a data atual é passada ou não está disponível, seleciona a primeira data disponível
				if (isCurrentDatePast || !isCurrentDateAvailable) {
					const firstDate = futureDates[0]
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
	}, [date, onDateChange, userId])
	// Carrega datas disponíveis ao montar o componente
	useEffect(() => {
		loadAvailableDates()
	}, [loadAvailableDates])
	const loadAppointments = useCallback(async () => {
		// Passo 1: ativar indicador de carregamento.
		// Passo 2: buscar agendamentos do dia selecionado.
		// Passo 3: armazenar ou limpar resultados conforme resposta.
		// Passo 4: encerrar o estado de loading.
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
	// Manipula mudança de data (usando timezone America/Sao_Paulo)
	const handleDateChange = (dateStr: string) => {
		// Passo 1: validar a string recebida do seletor.
		// Passo 2: converter para Date no timezone correto.
		// Passo 3: atualizar o estado local e notificar callback.
		// Passo 4: manter consistencia da data selecionada.
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
	// Formata data para exibição
	const formatDateForDisplay = (date: Date): string => {
		// Passo 1: definir formato de apresentacao.
		// Passo 2: delegar formatacao ao helper de timezone.
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		}
		return formatDateInSaoPaulo(date, options)
	}
	// Formata data para valor do select (YYYY-MM-DD) usando timezone local
	const formatDateForSelect = (date: Date): string => {
		// Passo 1: extrair componentes da data atual.
		// Passo 2: normalizar para o formato aceito pelo select.
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
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
