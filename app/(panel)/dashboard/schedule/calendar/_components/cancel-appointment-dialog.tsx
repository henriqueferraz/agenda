/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Dialog de confirmação de cancelamento de agendamento (F-02).
 * Exibe resumo do agendamento e campo de motivo opcional.
 * Chama cancelAppointment server action e exibe toast de resultado.
 *
 * @example
 * <CancelAppointmentDialog
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
} from '@/components/responsive-dialog'
import { cancelAppointment } from '../_actions/cancel-appointment'

/** Dados mínimos do agendamento para exibição no dialog. */
interface AppointmentSummary {
	/** ID do agendamento. */
	id: string
	/** Nome do cliente. */
	name: string
	/** Horário no formato HH:MM. */
	time: string
	/** Nome do serviço. */
	serviceName: string
	/** Nome do funcionário. */
	employeeName: string
}

/** Props do CancelAppointmentDialog. */
interface CancelAppointmentDialogProps {
	/** Se o dialog está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** Dados do agendamento a cancelar. */
	appointment: AppointmentSummary
	/** Callback executado após cancelamento bem-sucedido. */
	onSuccess: () => void
}

/**
 * Dialog de confirmação de cancelamento com campo de motivo.
 * Mostra resumo do agendamento e botões de confirmação/voltar.
 *
 * @param props - open, onOpenChange, appointment, onSuccess
 * @returns JSX.Element do dialog
 */
export const CancelAppointmentDialog = ({
	open,
	onOpenChange,
	appointment,
	onSuccess,
}: CancelAppointmentDialogProps): React.JSX.Element => {
	const [reason, setReason] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleCancel = async (): Promise<void> => {
		setIsLoading(true)
		try {
			const result = await cancelAppointment({
				appointmentId: appointment.id,
				reason: reason.trim() || undefined,
			})

			if (result.success) {
				toast.success(result.message || 'Agendamento cancelado.')
				setReason('')
				onOpenChange(false)
				onSuccess()
			} else {
				toast.error(result.error || 'Erro ao cancelar.')
			}
		} catch {
			toast.error('Erro inesperado ao cancelar agendamento.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent
				size="sm"
				title="Cancelar Agendamento"
				description="Esta ação não pode ser desfeita."
			>
				<div className="space-y-4">
					<div className="rounded-lg border bg-red-50 border-red-200 p-3 sm:p-4 space-y-1">
						<p className="font-semibold text-sm">{appointment.name}</p>
						<p className="text-xs text-muted-foreground">
							{appointment.time} — {appointment.serviceName}
						</p>
						<p className="text-xs text-muted-foreground">
							{appointment.employeeName}
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="cancel-reason">Motivo (opcional)</Label>
						<Textarea
							id="cancel-reason"
							placeholder="Informe o motivo do cancelamento..."
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							maxLength={500}
							className="resize-none"
							rows={3}
						/>
					</div>

					<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
							className="min-h-[44px]"
							aria-label="Voltar sem cancelar"
						>
							Voltar
						</Button>
						<Button
							variant="destructive"
							onClick={handleCancel}
							disabled={isLoading}
							className="min-h-[44px]"
							aria-label="Confirmar cancelamento do agendamento"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Cancelando...
								</>
							) : (
								'Confirmar Cancelamento'
							)}
						</Button>
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
