/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * Dialog para envio de mensagem WhatsApp individual a um cliente (F-07).
 * Permite selecionar um agendamento, visualizar os dados do cliente,
 * editar o template de mensagem pré-preenchido e enviar via sendIndividualMessage.
 *
 * @example
 * ```tsx
 * <IndividualMessageDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   appointments={appointments}
 * />
 * ```
 */
'use client'
import React, { useState, useTransition } from 'react'
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
} from '@/components/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { sendIndividualMessage } from '../_actions/send-individual-message'
import type { PeriodAppointment } from '../_data-access/get-appointments-by-period'

/** Props do componente IndividualMessageDialog. */
interface IndividualMessageDialogProps {
	/** Se o dialog está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** Lista de agendamentos futuros para seleção. */
	appointments: PeriodAppointment[]
}

/**
 * Formata uma data Date para DD/MM/YYYY usando timezone SP.
 */
const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat('pt-BR', {
		timeZone: 'America/Sao_Paulo',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(date)
}

/**
 * Gera o template padrão de mensagem individual.
 */
const buildTemplate = (apt: PeriodAppointment): string =>
	`Olá ${apt.name}! Sobre seu agendamento de ${apt.service.name} no dia ${formatDate(apt.appointmentDate)} às ${apt.time}: `

/**
 * Dialog para envio de mensagem individual via WhatsApp.
 *
 * @param props - open, onOpenChange, appointments
 * @returns React.ReactElement
 */
export const IndividualMessageDialog = ({
	open,
	onOpenChange,
	appointments,
}: IndividualMessageDialogProps): React.ReactElement => {
	const [selectedId, setSelectedId] = useState('')
	const [message, setMessage] = useState('')
	const [isPending, startTransition] = useTransition()

	const selectedAppointment = appointments.find((a) => a.id === selectedId)

	const handleSelectAppointment = (id: string): void => {
		setSelectedId(id)
		const apt = appointments.find((a) => a.id === id)
		if (apt) {
			setMessage(buildTemplate(apt))
		}
	}

	const handleSend = (): void => {
		if (!selectedId || !message.trim()) return

		startTransition(async () => {
			const result = await sendIndividualMessage({
				appointmentId: selectedId,
				message: message.trim(),
			})

			if (result.success) {
				toast.success(result.message)
				onOpenChange(false)
				setSelectedId('')
				setMessage('')
			} else {
				toast.error(result.error)
			}
		})
	}

	const handleClose = (isOpen: boolean): void => {
		if (!isOpen) {
			setSelectedId('')
			setMessage('')
		}
		onOpenChange(isOpen)
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={handleClose}>
			<ResponsiveDialogContent
				size='lg'
				title='Mensagem Individual'
				description='Envie uma mensagem via WhatsApp para um cliente específico'
			>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='select-appointment'>Selecionar agendamento</Label>
						<Select value={selectedId} onValueChange={handleSelectAppointment}>
							<SelectTrigger id='select-appointment' className='w-full'>
								<SelectValue placeholder='Escolha um agendamento...' />
							</SelectTrigger>
							<SelectContent>
								{appointments.map((apt) => (
									<SelectItem key={apt.id} value={apt.id}>
										{apt.name} — {apt.service.name} — {formatDate(apt.appointmentDate)} {apt.time}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedAppointment && (
						<div className='rounded-lg border bg-muted/50 p-3 text-sm space-y-1'>
							<p><span className='font-medium'>Cliente:</span> {selectedAppointment.name}</p>
							<p><span className='font-medium'>Telefone:</span> {selectedAppointment.phone}</p>
							<p><span className='font-medium'>Serviço:</span> {selectedAppointment.service.name}</p>
							<p><span className='font-medium'>Profissional:</span> {selectedAppointment.employee.name}</p>
							<p><span className='font-medium'>Data:</span> {formatDate(selectedAppointment.appointmentDate)} às {selectedAppointment.time}</p>
							<p><span className='font-medium'>Duração:</span> {selectedAppointment.service.duration} min</p>
						</div>
					)}

					<div className='space-y-2'>
						<Label htmlFor='individual-message'>Mensagem</Label>
						<Textarea
							id='individual-message'
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder='Digite sua mensagem...'
							rows={5}
							maxLength={2000}
							disabled={!selectedId}
							aria-label='Mensagem para o cliente'
						/>
						<p className='text-xs text-muted-foreground text-right'>
							{message.length}/2000
						</p>
					</div>

					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => handleClose(false)}
							className='min-h-[44px] min-w-[44px]'
							aria-label='Cancelar envio'
						>
							Voltar
						</Button>
						<Button
							onClick={handleSend}
							disabled={isPending || !selectedId || !message.trim()}
							className='min-h-[44px] min-w-[44px]'
							aria-label='Enviar mensagem via WhatsApp'
						>
							{isPending ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Enviando...
								</>
							) : (
								<>
									<Send className='mr-2 h-4 w-4' />
									Enviar WhatsApp
								</>
							)}
						</Button>
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
