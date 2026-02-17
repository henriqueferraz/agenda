/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Dialog de reagendamento de agendamento (F-02).
 * Permite selecionar nova data e horário através de uma grade de horários disponíveis.
 * Busca agendamentos existentes e calcula disponibilidade por funcionário.
 * Chama rescheduleAppointment server action.
 *
 * @example
 * <RescheduleAppointmentDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   appointment={appointment}
 *   userId="usr_1"
 *   companyTimes={companyTimes}
 *   onSuccess={handleReload}
 * />
 */
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Clock } from 'lucide-react'
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
} from '@/components/responsive-dialog'
import { rescheduleAppointment } from '../_actions/reschedule-appointment'
import { getDayAppointments } from '../_data-access/get-day-appointments'

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

/** Mapeamento de dia da semana (0=dom) para chave de CompanyTimes. */
const DAYS_MAP: Record<number, keyof CompanyTimes> = {
	0: 'sun_times',
	1: 'mon_times',
	2: 'tue_times',
	3: 'wed_times',
	4: 'thu_times',
	5: 'fri_times',
	6: 'sat_times',
}

/** Dados mínimos do agendamento para exibição no dialog. */
interface AppointmentSummary {
	/** ID do agendamento. */
	id: string
	/** Nome do cliente. */
	name: string
	/** Data atual do agendamento. */
	currentDate: string
	/** Horário atual no formato HH:MM. */
	currentTime: string
	/** Nome do serviço. */
	serviceName: string
	/** ID do funcionário do agendamento. */
	employeeId: string
	/** Duração do serviço em minutos. */
	serviceDuration: number
}

/** Props do RescheduleAppointmentDialog. */
interface RescheduleAppointmentDialogProps {
	/** Se o dialog está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** Dados do agendamento a reagendar. */
	appointment: AppointmentSummary
	/** ID do usuário (empresa). */
	userId: string
	/** Horários de funcionamento da empresa. */
	companyTimes: CompanyTimes | null
	/** Callback executado após reagendamento bem-sucedido. */
	onSuccess: () => void
}

/**
 * Dialog de reagendamento com seletor de data e grade de horários disponíveis.
 * Mostra dados atuais, busca agendamentos existentes na data selecionada
 * e exibe apenas horários livres do funcionário.
 *
 * @param props - open, onOpenChange, appointment, userId, companyTimes, onSuccess
 * @returns JSX.Element do dialog
 */
export const RescheduleAppointmentDialog = ({
	open,
	onOpenChange,
	appointment,
	userId,
	companyTimes,
	onSuccess,
}: RescheduleAppointmentDialogProps): React.JSX.Element => {
	const [newDate, setNewDate] = useState('')
	const [newTime, setNewTime] = useState('')
	const [reason, setReason] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingTimes, setIsLoadingTimes] = useState(false)
	const [availableTimes, setAvailableTimes] = useState<string[]>([])

	/**
	 * Calcula horários disponíveis para a data selecionada.
	 * Busca agendamentos existentes e filtra horários do funcionário.
	 */
	const loadAvailableTimes = useCallback(async (dateStr: string) => {
		if (!dateStr || !companyTimes || !userId) {
			setAvailableTimes([])
			return
		}

		setIsLoadingTimes(true)
		try {
			const [year, month, day] = dateStr.split('-').map(Number)
			const dateObj = new Date(year, month - 1, day)
			const dayOfWeek = dateObj.getDay()
			const dayKey = DAYS_MAP[dayOfWeek]

			// Horários da empresa para este dia da semana
			const companyTimesForDay = dayKey ? companyTimes[dayKey] ?? [] : []

			if (companyTimesForDay.length === 0) {
				setAvailableTimes([])
				return
			}

			// Busca agendamentos existentes para a data
			const existingAppointments = await getDayAppointments({ userId, date: dateObj })

			// Calcula horários ocupados pelo funcionário (exceto o agendamento atual)
			const occupiedTimes = new Set<string>()
			existingAppointments.forEach((apt) => {
				if (apt.id === appointment.id) return
				if (apt.status === 'cancelled') return
				if (apt.employeeId !== appointment.employeeId) return

				const startTime = apt.time
				const duration = apt.service?.duration ?? 30
				occupiedTimes.add(startTime)

				const [h, m] = startTime.split(':').map(Number)
				let currentMinutes = h * 60 + m + 30
				const endMinutes = h * 60 + m + duration

				while (currentMinutes < endMinutes) {
					const timeStr = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`
					occupiedTimes.add(timeStr)
					currentMinutes += 30
				}
			})

			// Filtra horários disponíveis (não ocupados e com duração suficiente)
			const available = companyTimesForDay.filter((time) => {
				if (occupiedTimes.has(time)) return false

				// Verifica se há tempo suficiente para o serviço
				const [h, m] = time.split(':').map(Number)
				let currentMinutes = h * 60 + m + 30
				const endMinutes = h * 60 + m + appointment.serviceDuration

				while (currentMinutes < endMinutes) {
					const timeStr = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`
					if (occupiedTimes.has(timeStr)) return false
					currentMinutes += 30
				}

				return true
			})

			setAvailableTimes(available)
		} catch (error) {
			console.error('Erro ao carregar horários disponíveis:', {
				error: error instanceof Error ? error.message : error,
			})
			setAvailableTimes([])
		} finally {
			setIsLoadingTimes(false)
		}
	}, [companyTimes, userId, appointment.id, appointment.employeeId, appointment.serviceDuration])

	// Recarrega horários quando a data muda
	useEffect(() => {
		if (open && newDate) {
			setNewTime('')
			loadAvailableTimes(newDate)
		}
	}, [open, newDate, loadAvailableTimes])

	// Reseta quando o dialog abre
	useEffect(() => {
		if (open) {
			setNewDate('')
			setNewTime('')
			setReason('')
			setAvailableTimes([])
		}
	}, [open])

	const handleReschedule = async (): Promise<void> => {
		if (!newDate || !newTime) {
			toast.error('Selecione a nova data e o novo horário.')
			return
		}

		if (!reason.trim()) {
			toast.error('Informe o motivo do reagendamento.')
			return
		}

		setIsLoading(true)
		try {
			const [year, month, day] = newDate.split('-').map(Number)
			const dateObj = new Date(year, month - 1, day)

			const result = await rescheduleAppointment({
				appointmentId: appointment.id,
				newDate: dateObj,
				newTime,
				reason: reason.trim(),
			})

			if (result.success) {
				toast.success(result.message || 'Agendamento reagendado.')
				setNewDate('')
				setNewTime('')
				setReason('')
				onOpenChange(false)
				onSuccess()
			} else {
				toast.error(result.error || 'Erro ao reagendar.')
			}
		} catch {
			toast.error('Erro inesperado ao reagendar agendamento.')
		} finally {
			setIsLoading(false)
		}
	}

	const todayStr = new Date().toISOString().split('T')[0]

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent
				size="md"
				title="Reagendar Agendamento"
				description="Selecione a nova data e horário."
			>
				<div className="space-y-4">
					<div className="rounded-lg border bg-muted/50 p-3 sm:p-4 space-y-1">
						<p className="font-semibold text-sm">{appointment.name}</p>
						<p className="text-xs text-muted-foreground">
							Atual: {appointment.currentDate} às {appointment.currentTime}
						</p>
						<p className="text-xs text-muted-foreground">
							{appointment.serviceName}
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="reschedule-date">Nova Data</Label>
						<Input
							id="reschedule-date"
							type="date"
							value={newDate}
							onChange={(e) => setNewDate(e.target.value)}
							min={todayStr}
							className="min-h-[44px]"
							aria-label="Selecionar nova data"
						/>
					</div>

					{newDate && (
						<div className="space-y-2">
							<Label className="flex items-center gap-1.5">
								<Clock className="h-4 w-4" />
								Novo Horário
							</Label>

							{isLoadingTimes ? (
								<div className="flex items-center justify-center py-6">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									<span className="ml-2 text-sm text-muted-foreground">Carregando horários...</span>
								</div>
							) : availableTimes.length === 0 ? (
								<p className="text-sm text-muted-foreground py-4 text-center">
									Nenhum horário disponível nesta data.
								</p>
							) : (
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 sm:max-h-64 overflow-y-auto p-1 rounded-md border bg-background">
									{availableTimes.map((t) => (
										<Button
											key={t}
											type="button"
											variant={newTime === t ? 'default' : 'outline'}
											size="sm"
											onClick={() => setNewTime(t)}
											className="min-h-[44px] min-w-[44px] text-sm font-medium"
											aria-label={`Selecionar horário ${t}`}
										>
											{t}
										</Button>
									))}
								</div>
							)}
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="reschedule-reason">
							Motivo do Reagendamento <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id="reschedule-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Informe o motivo do reagendamento..."
							maxLength={500}
							rows={3}
							className="min-h-[80px] resize-none"
							aria-label="Motivo do reagendamento"
							required
						/>
						<p className="text-xs text-muted-foreground text-right">
							{reason.length}/500
						</p>
					</div>

					<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
							className="min-h-[44px]"
							aria-label="Voltar sem reagendar"
						>
							Voltar
						</Button>
						<Button
							onClick={handleReschedule}
							disabled={isLoading || !newDate || !newTime || !reason.trim()}
							className="min-h-[44px]"
							aria-label="Confirmar reagendamento"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Reagendando...
								</>
							) : (
								'Confirmar Reagendamento'
							)}
						</Button>
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
