/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * Dialog para notificação de indisponibilidade do profissional (F-07).
 * Permite selecionar período, informar motivo, visualizar agendamentos afetados
 * com checkboxes individuais, opcionalmente cancelar e enviar notificação via WhatsApp.
 *
 * @example
 * ```tsx
 * <UnavailabilityDialog open={open} onOpenChange={setOpen} userId={userId} />
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, Search, Send } from 'lucide-react'
import { getAppointmentsByPeriod } from '../_data-access/get-appointments-by-period'
import type { PeriodAppointment } from '../_data-access/get-appointments-by-period'
import { notifyUnavailability } from '../_actions/notify-unavailability'

/** Props do componente UnavailabilityDialog. */
interface UnavailabilityDialogProps {
	/** Se o dialog está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** ID do usuário (empresa). */
	userId: string
}

/** Formata Date para DD/MM/YYYY no timezone SP. */
const formatDate = (date: Date): string =>
	new Intl.DateTimeFormat('pt-BR', {
		timeZone: 'America/Sao_Paulo',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(date)

/**
 * Gera template de mensagem de indisponibilidade.
 */
const buildTemplate = (reason: string, startDate: string, endDate: string): string =>
	`Olá! Infelizmente precisamos informar que estaremos indisponíveis de ${startDate} a ${endDate}. Motivo: ${reason}. Seu agendamento foi afetado. Caso precise, utilize o link abaixo para reagendar.`

/**
 * Dialog para notificação de indisponibilidade com cancelamento opcional.
 *
 * @param props - open, onOpenChange, userId
 * @returns React.ReactElement
 */
export const UnavailabilityDialog = ({
	open,
	onOpenChange,
	userId,
}: UnavailabilityDialogProps): React.ReactElement => {
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [reason, setReason] = useState('')
	const [appointments, setAppointments] = useState<PeriodAppointment[]>([])
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [cancelSelected, setCancelSelected] = useState(true)
	const [message, setMessage] = useState('')
	const [isSearching, setIsSearching] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)
	const [isPending, startTransition] = useTransition()

	const handleSearch = async (): Promise<void> => {
		if (!startDate || !endDate) {
			toast.error('Informe as datas de início e fim.')
			return
		}

		setIsSearching(true)
		try {
			const result = await getAppointmentsByPeriod({ userId, startDate, endDate })
			setAppointments(result)
			setSelectedIds(new Set(result.map((a) => a.id)))
			setHasSearched(true)

			const startFormatted = new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')
			const endFormatted = new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')
			setMessage(buildTemplate(reason || '[motivo]', startFormatted, endFormatted))
		} finally {
			setIsSearching(false)
		}
	}

	const handleReasonChange = (newReason: string): void => {
		setReason(newReason)
		if (hasSearched) {
			const startFormatted = new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')
			const endFormatted = new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')
			setMessage(buildTemplate(newReason || '[motivo]', startFormatted, endFormatted))
		}
	}

	const toggleSelection = (id: string): void => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	const selectAll = (): void => {
		setSelectedIds(new Set(appointments.map((a) => a.id)))
	}

	const clearSelection = (): void => {
		setSelectedIds(new Set())
	}

	const handleSend = (): void => {
		if (selectedIds.size === 0 || !message.trim() || !reason.trim()) return

		startTransition(async () => {
			const result = await notifyUnavailability({
				appointmentIds: Array.from(selectedIds),
				reason: reason.trim(),
				message: message.trim(),
				cancelAppointments: cancelSelected,
			})

			if (result.success) {
				toast.success(result.message)
				onOpenChange(false)
				resetState()
			} else {
				toast.error(result.error)
			}
		})
	}

	const resetState = (): void => {
		setStartDate('')
		setEndDate('')
		setReason('')
		setAppointments([])
		setSelectedIds(new Set())
		setCancelSelected(true)
		setMessage('')
		setHasSearched(false)
	}

	const handleClose = (isOpen: boolean): void => {
		if (!isOpen) resetState()
		onOpenChange(isOpen)
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={handleClose}>
			<ResponsiveDialogContent
				size='lg'
				title='Aviso de Indisponibilidade'
				description='Notifique clientes sobre sua indisponibilidade e opcionalmente cancele os agendamentos'
			>
				<div className='space-y-4'>
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
						<div className='space-y-1'>
							<Label htmlFor='unavail-start-date'>Data início</Label>
							<Input
								id='unavail-start-date'
								type='date'
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								aria-label='Data de início da indisponibilidade'
							/>
						</div>
						<div className='space-y-1'>
							<Label htmlFor='unavail-end-date'>Data fim</Label>
							<Input
								id='unavail-end-date'
								type='date'
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								aria-label='Data de fim da indisponibilidade'
							/>
						</div>
						<div className='flex items-end'>
							<Button
								onClick={handleSearch}
								disabled={isSearching || !startDate || !endDate}
								className='min-h-[44px] w-full min-w-[44px]'
								aria-label='Buscar agendamentos afetados'
							>
								{isSearching ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<Search className='mr-2 h-4 w-4' />
								)}
								Buscar
							</Button>
						</div>
					</div>

					<div className='space-y-1'>
						<Label htmlFor='unavail-reason'>Motivo</Label>
						<Input
							id='unavail-reason'
							value={reason}
							onChange={(e) => handleReasonChange(e.target.value)}
							placeholder='Ex: Indisposição médica, feriado, etc.'
							maxLength={500}
							aria-label='Motivo da indisponibilidade'
						/>
					</div>

					{hasSearched && appointments.length === 0 && (
						<p className='text-center text-sm text-muted-foreground py-4'>
							Nenhum agendamento confirmado encontrado no período.
						</p>
					)}

					{appointments.length > 0 && (
						<>
							<div className='flex items-center justify-between'>
								<p className='text-sm font-medium'>
									<AlertTriangle className='mr-1 inline h-4 w-4 text-amber-500' />
									{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} afetado{appointments.length !== 1 ? 's' : ''}
								</p>
								<div className='flex gap-2'>
									<Button
										variant='ghost'
										size='sm'
										onClick={selectAll}
										className='text-xs'
										aria-label='Selecionar todos'
									>
										Selecionar todos
									</Button>
									<Button
										variant='ghost'
										size='sm'
										onClick={clearSelection}
										className='text-xs'
										aria-label='Limpar seleção'
									>
										Limpar
									</Button>
								</div>
							</div>

							<div className='max-h-40 overflow-y-auto rounded-lg border sm:max-h-52'>
								{appointments.map((apt) => (
									<label
										key={apt.id}
										className='flex cursor-pointer items-center gap-3 border-b p-2 last:border-b-0 hover:bg-muted/50 sm:p-3'
									>
										<Checkbox
											checked={selectedIds.has(apt.id)}
											onCheckedChange={() => toggleSelection(apt.id)}
											aria-label={`Selecionar ${apt.name}`}
										/>
										<div className='flex-1 text-sm'>
											<span className='font-medium'>{apt.name}</span>
											<span className='text-muted-foreground'> — {apt.service.name} — {formatDate(apt.appointmentDate)} {apt.time}</span>
										</div>
									</label>
								))}
							</div>

							<div className='flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20 sm:p-4'>
								<div>
									<Label htmlFor='cancel-switch' className='text-sm font-medium'>
										Cancelar selecionados automaticamente
									</Label>
									<p className='text-xs text-muted-foreground'>
										Os agendamentos marcados serão cancelados além de notificados
									</p>
								</div>
								<Switch
									id='cancel-switch'
									checked={cancelSelected}
									onCheckedChange={setCancelSelected}
									aria-label='Cancelar agendamentos selecionados'
									className='data-[state=checked]:bg-amber-500'
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='unavail-message'>
									Mensagem ({selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''})
								</Label>
								<Textarea
									id='unavail-message'
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder='Mensagem de aviso...'
									rows={4}
									maxLength={2000}
									aria-label='Mensagem de indisponibilidade'
								/>
								<p className='text-xs text-muted-foreground text-right'>
									{message.length}/2000
								</p>
							</div>
						</>
					)}

					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => handleClose(false)}
							className='min-h-[44px] min-w-[44px]'
							aria-label='Cancelar'
						>
							Voltar
						</Button>
						{appointments.length > 0 && (
							<Button
								onClick={handleSend}
								disabled={isPending || selectedIds.size === 0 || !message.trim() || !reason.trim()}
								variant={cancelSelected ? 'destructive' : 'default'}
								className='min-h-[44px] min-w-[44px]'
								aria-label={`Notificar ${selectedIds.size} clientes`}
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Enviando...
									</>
								) : (
									<>
										<Send className='mr-2 h-4 w-4' />
										{cancelSelected
											? `Notificar e cancelar (${selectedIds.size})`
											: `Notificar ${selectedIds.size} cliente${selectedIds.size !== 1 ? 's' : ''}`
										}
									</>
								)}
							</Button>
						)}
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
