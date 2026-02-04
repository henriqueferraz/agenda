/**
 * Componente - Monthly Calendar
 *
 * Visao geral:
 * - Componente React para Monthly Calendar.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Renderizar o calendário mensal com seleção de datas.
 * - Destacar feriados e bloquear dias sem funcionamento.
 * - Isolar estilos e comportamento do componente.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_components/monthly-calendar";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { useState, useEffect } from 'react'
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getMonthStopDays } from '../_data-access/get-month-stopdays'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface MonthlyCalendarProps {
	/** Data selecionada */
	selectedDate: Date | null
	/** Callback quando um dia é clicado */
	onDateSelect: (date: Date) => void
	/** Horários de funcionamento da empresa */
	companyTimes: CompanyTimes | null
	/** ID do usuário (empresa) */
	userId: string
}
interface CompanyTimes {
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
}
const MONTHS = [
	'Janeiro',
	'Fevereiro',
	'Março',
	'Abril',
	'Maio',
	'Junho',
	'Julho',
	'Agosto',
	'Setembro',
	'Outubro',
	'Novembro',
	'Dezembro',
]
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
export const MonthlyCalendar = ({
	selectedDate,
	onDateSelect,
	companyTimes,
	userId,
}: MonthlyCalendarProps) => {
	// Passo 1: inicializar estados de mes/ano e dados do calendario.
	// Passo 2: preparar handlers de navegacao e selecao.
	// Passo 3: carregar indicadores de feriados.
	// Passo 4: renderizar o grid de dias com destaques.
	const [currentDate, setCurrentDate] = useState(new Date())
	const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
	const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
	const [daysWithStopDays, setDaysWithStopDays] = useState<number[]>([])
	// Ajusta o mês/ano quando mudar o seletor
	const handleMonthChange = (monthIndex: number) => {
		// Passo 1: atualizar o mes selecionado.
		// Passo 2: reconstruir a data de referencia do calendario.
		// Passo 3: sincronizar estado de mes e ano visiveis.
		setSelectedMonth(monthIndex)
		const newDate = new Date(selectedYear, monthIndex, 1)
		setCurrentDate(newDate)
	}
	const handleYearChange = (year: number) => {
		// Passo 1: atualizar o ano selecionado.
		// Passo 2: reconstruir a data de referencia do calendario.
		// Passo 3: sincronizar estado de mes e ano visiveis.
		setSelectedYear(year)
		const newDate = new Date(year, selectedMonth, 1)
		setCurrentDate(newDate)
	}
	// Navegação de mês
	const goToPreviousMonth = () => {
		// Passo 1: calcular o mes anterior.
		// Passo 2: atualizar data base e seletores.
		const newDate = new Date(currentDate)
		newDate.setMonth(newDate.getMonth() - 1)
		setCurrentDate(newDate)
		setSelectedMonth(newDate.getMonth())
		setSelectedYear(newDate.getFullYear())
	}
	const goToNextMonth = () => {
		// Passo 1: calcular o proximo mes.
		// Passo 2: atualizar data base e seletores.
		const newDate = new Date(currentDate)
		newDate.setMonth(newDate.getMonth() + 1)
		setCurrentDate(newDate)
		setSelectedMonth(newDate.getMonth())
		setSelectedYear(newDate.getFullYear())
	}
	const goToToday = () => {
		// Passo 1: obter a data atual.
		// Passo 2: atualizar estado de mes e ano correntes.
		const today = new Date()
		setCurrentDate(today)
		setSelectedMonth(today.getMonth())
		setSelectedYear(today.getFullYear())
	}
	// Carrega feriados do mês quando o mês/ano muda
	useEffect(() => {
		const loadData = async () => {
			// Passo 1: validar se ha usuario para consulta.
			// Passo 2: buscar feriados.
			// Passo 3: armazenar os dias retornados.
			// Passo 4: registrar erros caso ocorram.
			if (!userId) return
			try {
				const stopDays = await getMonthStopDays({
					userId,
					year: selectedYear,
					month: selectedMonth,
				})
				setDaysWithStopDays(stopDays)
			} catch (error) {
				console.error('Erro ao carregar dados do mês:', error)
			}
		}
		loadData()
	}, [userId, selectedYear, selectedMonth])
	// Gera os dias do mês
	const getDaysInMonth = () => {
		// Passo 1: calcular primeiro e ultimo dia do mes atual.
		// Passo 2: inserir placeholders antes do primeiro dia util.
		// Passo 3: preencher a lista com todos os dias do mes.
		const year = currentDate.getFullYear()
		const month = currentDate.getMonth()
		// Primeiro dia do mês
		const firstDay = new Date(year, month, 1)
		// Último dia do mês
		const lastDay = new Date(year, month + 1, 0)
		// Dia da semana do primeiro dia (0 = domingo, 1 = segunda, etc.)
		// Ajustamos para segunda = 0
		const firstDayOfWeek = (firstDay.getDay() + 6) % 7 // Converte domingo (0) para 6, segunda (1) para 0
		const days: (Date | null)[] = []
		// Adiciona dias vazios antes do primeiro dia do mês
		for (let i = 0; i < firstDayOfWeek; i++) {
			days.push(null)
		}
		// Adiciona todos os dias do mês
		for (let day = 1; day <= lastDay.getDate(); day++) {
			days.push(new Date(year, month, day))
		}
		return days
	}
	const days = getDaysInMonth()
	const weeks: (Date | null)[][] = []
	// Divide os dias em semanas
	for (let i = 0; i < days.length; i += 7) {
		weeks.push(days.slice(i, i + 7))
	}
	const isToday = (date: Date | null): boolean => {
		// Passo 1: ignorar valores nulos.
		// Passo 2: comparar dia/mes/ano com a data atual.
		if (!date) return false
		const today = new Date()
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		)
	}
	const isSelected = (date: Date | null): boolean => {
		// Passo 1: garantir que existe data selecionada.
		// Passo 2: comparar dia/mes/ano com a selecao atual.
		if (!date || !selectedDate) return false
		return (
			date.getDate() === selectedDate.getDate() &&
			date.getMonth() === selectedDate.getMonth() &&
			date.getFullYear() === selectedDate.getFullYear()
		)
	}
	const isPast = (date: Date | null): boolean => {
		// Passo 1: ignorar valores nulos.
		// Passo 2: comparar data normalizada com hoje.
		if (!date) return false
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const dateToCheck = new Date(date)
		dateToCheck.setHours(0, 0, 0, 0)
		return dateToCheck < today
	}
	const isStopDay = (date: Date | null): boolean => {
		// Passo 1: validar a data recebida.
		// Passo 2: verificar se o dia consta na lista de feriados.
		if (!date) return false
		return daysWithStopDays.includes(date.getDate())
	}
	const isCompanyClosed = (date: Date | null): boolean => {
		// Passo 1: validar entradas e disponibilidade de horários.
		// Passo 2: mapear o dia da semana para o horário correspondente.
		// Passo 3: retornar se o dia não tem horários disponíveis.
		if (!date || !companyTimes) return false
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
	// Gera anos para o seletor (últimos 5 anos e próximos 5 anos)
	const currentYear = new Date().getFullYear()
	const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						<CalendarIcon className='h-5 w-5' />
						Calendário
					</CardTitle>
					<Button variant='outline' size='sm' onClick={goToToday}>
						Hoje
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{/* Seletor de mês e ano */}
				<div className='flex items-center justify-between mb-4 gap-2'>
					<Button
						variant='outline'
						size='icon'
						onClick={goToPreviousMonth}
						className='h-8 w-8'
					>
						<ChevronLeft className='h-4 w-4' />
					</Button>

					<div className='flex items-center gap-2'>
						<Select
							value={selectedMonth.toString()}
							onValueChange={(value) => handleMonthChange(parseInt(value))}
						>
							<SelectTrigger className='w-[140px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MONTHS.map((month, index) => (
									<SelectItem key={index} value={index.toString()}>
										{month}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={selectedYear.toString()}
							onValueChange={(value) => handleYearChange(parseInt(value))}
						>
							<SelectTrigger className='w-[100px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{years.map((year) => (
									<SelectItem key={year} value={year.toString()}>
										{year}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<Button
						variant='outline'
						size='icon'
						onClick={goToNextMonth}
						className='h-8 w-8'
					>
						<ChevronRight className='h-4 w-4' />
					</Button>
				</div>

				{/* Cabeçalho dos dias da semana */}
				<div className='grid grid-cols-7 gap-1 mb-2'>
					{WEEKDAYS.map((day) => (
						<div
							key={day}
							className='text-center text-sm font-medium text-muted-foreground py-2'
						>
							{day}
						</div>
					))}
				</div>

				{/* Dias do mês */}
				<div className='space-y-1'>
					{weeks.map((week, weekIndex) => (
						<div key={weekIndex} className='grid grid-cols-7 gap-1'>
							{week.map((day, dayIndex) => {
								if (!day) {
									return (
										<div key={`empty-${dayIndex}`} className='aspect-square' />
									)
								}
								const today = isToday(day)
								const selected = isSelected(day)
								const past = isPast(day)
								const stopDay = isStopDay(day)
								const companyClosed = isCompanyClosed(day)
								return (
									<button
										key={day.toISOString()}
										type='button'
										onClick={() =>
											!past && !stopDay && !companyClosed && onDateSelect(day)
										}
										disabled={past || stopDay || companyClosed}
										className={cn(
											'aspect-square rounded-md border text-sm transition-colors relative',
											(past || stopDay || companyClosed) &&
											'opacity-50 cursor-not-allowed',
											!past &&
											!stopDay &&
											!companyClosed &&
											'hover:bg-accent hover:text-accent-foreground',
											!past &&
											!stopDay &&
											!companyClosed &&
											'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
											today &&
											!selected &&
											!past &&
											!stopDay &&
											!companyClosed &&
											'bg-blue-50 border-blue-300 font-semibold',
											selected &&
											'bg-blue-600 text-white border-blue-700 font-semibold',
											!today &&
											!selected &&
											!past &&
											!stopDay &&
											!companyClosed &&
											'border-border',
											companyClosed &&
											!stopDay &&
											'bg-gray-100 border-gray-200',
											stopDay &&
											'bg-red-50 border-red-400 text-red-700 font-semibold',
											past && !stopDay && 'bg-gray-100 border-gray-200',
										)}
									>
										{day.getDate()}

										{stopDay && (
											<span className='absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full' />
										)}
									</button>
								)
							})}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
