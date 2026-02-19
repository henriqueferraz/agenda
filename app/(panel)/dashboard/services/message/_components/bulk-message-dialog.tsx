/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-19
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * Dialog para envio de mensagem WhatsApp em massa para clientes selecionados (F-07).
 * Permite selecionar um período, exibir a lista de clientes com checkboxes individuais,
 * editar o template de mensagem e enviar via sendBulkMessage.
 *
 * @example
 * ```tsx
 * <BulkMessageDialog open={open} onOpenChange={setOpen} userId={userId} />
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
import { toast } from 'sonner'
import { Loader2, Search, Send, Users } from 'lucide-react'
import { getAppointmentsByPeriod } from '../_data-access/get-appointments-by-period'
import type { PeriodAppointment } from '../_data-access/get-appointments-by-period'
import { sendBulkMessage } from '../_actions/send-bulk-message'

/** Props do componente BulkMessageDialog. */
interface BulkMessageDialogProps {
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
 * Dialog para envio de mensagem em massa via WhatsApp com seleção de clientes.
 *
 * @param props - open, onOpenChange, userId
 * @returns React.ReactElement
 */
export const BulkMessageDialog = ({
	open,
	onOpenChange,
	userId,
}: BulkMessageDialogProps): React.ReactElement => {
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [appointments, setAppointments] = useState<PeriodAppointment[]>([])
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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

			if (result.length > 0 && !message) {
				setMessage('Olá! Gostaríamos de informar que ')
			}
		} finally {
			setIsSearching(false)
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
		if (selectedIds.size === 0 || !message.trim()) return

		startTransition(async () => {
			const result = await sendBulkMessage({
				appointmentIds: Array.from(selectedIds),
				message: message.trim(),
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
		setAppointments([])
		setSelectedIds(new Set())
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
				title='Mensagem em Massa'
				description='Envie uma mensagem para vários clientes de uma vez'
			>
				<div className='space-y-4'>
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
						<div className='space-y-1'>
							<Label htmlFor='bulk-start-date'>Data início</Label>
							<Input
								id='bulk-start-date'
								type='date'
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								aria-label='Data de início do período'
							/>
						</div>
						<div className='space-y-1'>
							<Label htmlFor='bulk-end-date'>Data fim</Label>
							<Input
								id='bulk-end-date'
								type='date'
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								aria-label='Data de fim do período'
							/>
						</div>
						<div className='flex items-end'>
							<Button
								onClick={handleSearch}
								disabled={isSearching || !startDate || !endDate}
								className='min-h-[44px] w-full min-w-[44px]'
								aria-label='Buscar agendamentos no período'
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

					{hasSearched && appointments.length === 0 && (
						<p className='text-center text-sm text-muted-foreground py-4'>
							Nenhum agendamento confirmado encontrado no período.
						</p>
					)}

					{appointments.length > 0 && (
						<>
							<div className='flex items-center justify-between'>
								<p className='text-sm font-medium'>
									{appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} encontrado{appointments.length !== 1 ? 's' : ''}
								</p>
								<div className='flex gap-2'>
									<Button
										variant='ghost'
										size='sm'
										onClick={selectAll}
										className='text-xs'
										aria-label='Selecionar todos os clientes'
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

							<div className='max-h-48 overflow-y-auto rounded-lg border sm:max-h-60'>
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

							<div className='space-y-2'>
								<Label htmlFor='bulk-message'>
									Mensagem ({selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''})
								</Label>
								<Textarea
									id='bulk-message'
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder='Digite a mensagem para os clientes...'
									rows={4}
									maxLength={2000}
									aria-label='Mensagem para os clientes'
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
							aria-label='Cancelar envio em massa'
						>
							Voltar
						</Button>
						{appointments.length > 0 && (
							<Button
								onClick={handleSend}
								disabled={isPending || selectedIds.size === 0 || !message.trim()}
								className='min-h-[44px] min-w-[44px]'
								aria-label={`Enviar para ${selectedIds.size} clientes`}
							>
								{isPending ? (
									<>
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										Enviando...
									</>
								) : (
									<>
										<Users className='mr-2 h-4 w-4' />
										Enviar para {selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''}
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
