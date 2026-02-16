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
 * Permite selecionar nova data e horário. Chama rescheduleAppointment server action.
 *
 * @example
 * <RescheduleAppointmentDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   appointment={appointment}
 *   onSuccess={handleReload}
 * />
 */
'use client'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
} from '@/components/responsive-dialog'
import { rescheduleAppointment } from '../_actions/reschedule-appointment'

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
}

/** Props do RescheduleAppointmentDialog. */
interface RescheduleAppointmentDialogProps {
	/** Se o dialog está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** Dados do agendamento a reagendar. */
	appointment: AppointmentSummary
	/** Callback executado após reagendamento bem-sucedido. */
	onSuccess: () => void
}

/**
 * Dialog de reagendamento com seletores de data e horário.
 * Mostra dados atuais e permite selecionar novos valores.
 *
 * @param props - open, onOpenChange, appointment, onSuccess
 * @returns JSX.Element do dialog
 */
export const RescheduleAppointmentDialog = ({
	open,
	onOpenChange,
	appointment,
	onSuccess,
}: RescheduleAppointmentDialogProps): React.JSX.Element => {
	const [newDate, setNewDate] = useState('')
	const [newTime, setNewTime] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleReschedule = async (): Promise<void> => {
		if (!newDate || !newTime) {
			toast.error('Selecione a nova data e o novo horário.')
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
			})

			if (result.success) {
				toast.success(result.message || 'Agendamento reagendado.')
				setNewDate('')
				setNewTime('')
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
				size="sm"
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

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

						<div className="space-y-2">
							<Label htmlFor="reschedule-time">Novo Horário</Label>
							<Input
								id="reschedule-time"
								type="time"
								value={newTime}
								onChange={(e) => setNewTime(e.target.value)}
								className="min-h-[44px]"
								aria-label="Selecionar novo horário"
							/>
						</div>
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
							disabled={isLoading || !newDate || !newTime}
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
