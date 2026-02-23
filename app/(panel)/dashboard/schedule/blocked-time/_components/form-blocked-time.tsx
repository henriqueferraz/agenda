/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Formulário de criação de bloqueio de horário por funcionário. Campos: funcionário
 * (select), data (date), horário (select com slots do funcionário no dia), motivo
 * (textarea). Calcula horários disponíveis a partir da interseção empresa x funcionário,
 * removendo agendamentos confirmados e bloqueios existentes.
 *
 * @example
 * ```tsx
 * <FormBlockedTime userId={userId} employees={employees} onSuccess={loadData} />
 * ```
 */
'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createBlockedTime } from '../_actions/create-blocked-time'
import { getBlockedTimesForEmployeeDate } from '../_data-access/get-blocked-times-for-employee-date'
import { getCompanyTimes } from '@/app/(panel)/dashboard/services/employee/_data-access/get-company-times'

/** Mapeamento de dia da semana (0=dom, 6=sab) para chave de times */
const DAYS_MAP: Record<number, string> = {
	0: 'sun_times',
	1: 'mon_times',
	2: 'tue_times',
	3: 'wed_times',
	4: 'thu_times',
	5: 'fri_times',
	6: 'sat_times',
}

/** Props do formulário de criação de bloqueio */
interface FormBlockedTimeProps {
	/** ID do usuário (empresa) */
	userId: string
	/** Lista de funcionários ativos com seus horários */
	employees: {
		id: string
		name: string
		mon_times: string[]
		tue_times: string[]
		wed_times: string[]
		thu_times: string[]
		fri_times: string[]
		sat_times: string[]
		sun_times: string[]
	}[]
	/** Callback chamado após criação bem-sucedida */
	onSuccess?: () => void
}

/**
 * Formulário para criar bloqueios de horário por funcionário.
 * Ao selecionar funcionário + data, calcula horários disponíveis
 * (interseção empresa x funcionário) e remove os já ocupados/bloqueados.
 *
 * @param props - userId, employees, onSuccess
 * @returns React.JSX.Element
 *
 * @example
 * ```tsx
 * <FormBlockedTime userId="usr_123" employees={employees} onSuccess={reload} />
 * ```
 */
export const FormBlockedTime = ({
	userId,
	employees,
	onSuccess,
}: FormBlockedTimeProps) => {
	const [employeeId, setEmployeeId] = useState<string>('')
	const [date, setDate] = useState<string>('')
	const [time, setTime] = useState<string>('')
	const [motivation, setMotivation] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingSlots, setIsLoadingSlots] = useState(false)
	const [availableSlots, setAvailableSlots] = useState<string[]>([])
	const [companyTimes, setCompanyTimes] = useState<Record<string, string[]> | null>(null)
	const [hasNoSlots, setHasNoSlots] = useState(false)

	useEffect(() => {
		const loadCompanyTimes = async () => {
			const times = await getCompanyTimes({ userId })
			setCompanyTimes(times as Record<string, string[]> | null)
		}
		loadCompanyTimes()
	}, [userId])

	const selectedEmployee = useMemo(
		() => employees.find((e) => e.id === employeeId),
		[employees, employeeId],
	)

	useEffect(() => {
		setTime('')
		setAvailableSlots([])
		setHasNoSlots(false)

		if (!employeeId || !date || !companyTimes || !selectedEmployee) return

		const loadSlots = async () => {
			setIsLoadingSlots(true)
			try {
				const selectedDate = new Date(date + 'T00:00:00')
				const dayOfWeek = selectedDate.getDay()
				const dayKey = DAYS_MAP[dayOfWeek]

				const companyDayTimes = (companyTimes as Record<string, string[]>)[dayKey] ?? []
				const employeeDayTimes = (selectedEmployee as unknown as Record<string, string[]>)[dayKey] ?? []

				if (companyDayTimes.length === 0 || employeeDayTimes.length === 0) {
					setAvailableSlots([])
					setHasNoSlots(true)
					return
				}

				const employeeTimeSet = new Set(employeeDayTimes)
				const baseTimes = companyDayTimes.filter((t) => employeeTimeSet.has(t))

				const blockedTimes = await getBlockedTimesForEmployeeDate({
					employeeId,
					date: selectedDate,
					userId,
				})
				const blockedSet = new Set(blockedTimes.map((b) => b.time))

				const filtered = baseTimes.filter((t) => !blockedSet.has(t))
				setAvailableSlots(filtered.sort())
				setHasNoSlots(filtered.length === 0)
			} catch (error) {
				console.error('Erro ao carregar horários disponíveis:', error)
				setAvailableSlots([])
				setHasNoSlots(true)
			} finally {
				setIsLoadingSlots(false)
			}
		}
		loadSlots()
	}, [employeeId, date, companyTimes, selectedEmployee, userId])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!employeeId) {
			toast.error('Selecione um funcionário')
			return
		}
		if (!date) {
			toast.error('Selecione uma data')
			return
		}
		if (!time) {
			toast.error('Selecione um horário')
			return
		}
		if (!motivation.trim()) {
			toast.error('Informe o motivo do bloqueio')
			return
		}

		setIsLoading(true)
		try {
			const selectedDate = new Date(date + 'T00:00:00')
			const result = await createBlockedTime({
				date: selectedDate,
				time,
				motivation: motivation.trim(),
				employeeId,
				userId,
			})
			if (result.success) {
				toast.success(result.message || 'Bloqueio criado com sucesso!')
				setEmployeeId('')
				setDate('')
				setTime('')
				setMotivation('')
				setAvailableSlots([])
				if (onSuccess) onSuccess()
			} else {
				toast.error(result.error || 'Erro ao criar bloqueio')
			}
		} catch (error) {
			console.error('Erro ao salvar bloqueio:', error)
			toast.error('Erro inesperado ao salvar bloqueio')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Clock className='h-5 w-5' />
					Novo Bloqueio de Horário
				</CardTitle>
				<CardDescription>
					Bloqueie um horário específico de um funcionário para impedir agendamentos
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='employee'>Funcionário</Label>
							<Select value={employeeId} onValueChange={setEmployeeId}>
								<SelectTrigger id='employee' className='min-h-[44px]'>
									<SelectValue placeholder='Selecione um funcionário' />
								</SelectTrigger>
								<SelectContent>
									{employees.map((emp) => (
										<SelectItem key={emp.id} value={emp.id}>
											{emp.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='block-date'>Data</Label>
							<Input
								id='block-date'
								type='date'
								value={date}
								onChange={(e) => setDate(e.target.value)}
								required
								min={new Date().toISOString().split('T')[0]}
								className='min-h-[44px]'
							/>
						</div>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='block-time'>Horário</Label>
							{isLoadingSlots ? (
								<div className='flex items-center gap-2 text-sm text-muted-foreground min-h-[44px]'>
									<Loader2 className='h-4 w-4 animate-spin' />
									Carregando horários...
								</div>
							) : (
								<Select
									value={time}
									onValueChange={setTime}
									disabled={availableSlots.length === 0}
								>
									<SelectTrigger id='block-time' className='min-h-[44px]'>
										<SelectValue
											placeholder={
												!employeeId || !date
													? 'Selecione funcionário e data'
													: hasNoSlots
														? 'Nenhum horário disponível'
														: 'Selecione um horário'
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{availableSlots.map((slot) => (
											<SelectItem key={slot} value={slot}>
												{slot}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='block-motivation'>Motivo</Label>
							<Textarea
								id='block-motivation'
								value={motivation}
								onChange={(e) => setMotivation(e.target.value)}
								placeholder='Ex: Consulta médica, Compromisso pessoal...'
								required
								rows={2}
								maxLength={500}
							/>
							<p className='text-sm text-muted-foreground'>
								{motivation.length}/500 caracteres
							</p>
						</div>
					</div>

					{hasNoSlots && employeeId && date && (
						<Alert>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>
								Não há horários disponíveis para bloqueio nesta data.
								O funcionário pode não trabalhar neste dia ou todos os
								horários já estão bloqueados.
							</AlertDescription>
						</Alert>
					)}

					<Button
						type='submit'
						disabled={isLoading || isLoadingSlots || !time}
						className='w-full sm:w-auto min-h-[44px]'
					>
						{isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
						Criar Bloqueio
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
