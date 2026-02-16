/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Modal de detalhes de agendamento com ações (F-02).
 * Exibe dados completos do cliente, serviço, funcionário e histórico de alterações.
 * Botões de ação no rodapé: Editar, Reagendar e Cancelar (desabilitados se cancelado).
 *
 * @example
 * <AppointmentDetailModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   appointment={appointment}
 *   onEdit={handleEdit}
 *   onReschedule={handleReschedule}
 *   onCancel={handleCancel}
 * />
 */
'use client'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Briefcase, Clock, Mail, Phone, Calendar, Pencil, RefreshCw, X } from 'lucide-react'
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
} from '@/components/responsive-dialog'
import { formatCurrency } from '@/lib/utils'
import { formatDateInSaoPaulo } from '@/utils/date-timezone'

/** Histórico de alteração do agendamento. */
interface HistoryEntry {
	/** ID do registro. */
	id: string
	/** Ação realizada. */
	action: string
	/** Quem realizou. */
	performedBy: string
	/** Alterações em JSON. */
	changes: Record<string, { from: unknown; to: unknown }> | null
	/** Motivo (para cancelamento). */
	reason: string | null
	/** Data do registro. */
	createdAt: Date
}

/** Dados completos do agendamento para o modal. */
interface AppointmentDetail {
	/** ID do agendamento. */
	id: string
	/** Nome do cliente. */
	name: string
	/** Email do cliente. */
	email: string
	/** Telefone do cliente. */
	phone: string
	/** Data do agendamento. */
	appointmentDate: Date
	/** Horário no formato HH:MM. */
	time: string
	/** Status do agendamento. */
	status: string
	/** Motivo do cancelamento. */
	cancelReason: string | null
	/** Dados do serviço. */
	service: {
		id: string
		name: string
		price: number
		duration: number
	}
	/** Dados do funcionário. */
	employee: {
		id: string
		name: string
	}
	/** Histórico de alterações. */
	history: HistoryEntry[]
}

/** Props do AppointmentDetailModal. */
interface AppointmentDetailModalProps {
	/** Se o modal está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** Dados completos do agendamento. */
	appointment: AppointmentDetail | null
	/** Callback para abrir o dialog de edição. */
	onEdit: () => void
	/** Callback para abrir o dialog de reagendamento. */
	onReschedule: () => void
	/** Callback para abrir o dialog de cancelamento. */
	onCancel: () => void
}

/** Mapa de labels para ações do histórico. */
const ACTION_LABELS: Record<string, string> = {
	created: 'Criado',
	cancelled: 'Cancelado',
	rescheduled: 'Reagendado',
	edited: 'Editado',
}

/** Mapa de labels para quem realizou. */
const PERFORMER_LABELS: Record<string, string> = {
	professional: 'Profissional',
	client: 'Cliente',
	system: 'Sistema',
}

/**
 * Modal com detalhes completos do agendamento e botões de ação.
 * Exibe dados do cliente, serviço, funcionário e histórico.
 *
 * @param props - open, onOpenChange, appointment, onEdit, onReschedule, onCancel
 * @returns JSX.Element do modal
 */
export const AppointmentDetailModal = ({
	open,
	onOpenChange,
	appointment,
	onEdit,
	onReschedule,
	onCancel,
}: AppointmentDetailModalProps): React.JSX.Element => {
	if (!appointment) {
		return (
			<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
				<ResponsiveDialogContent size="md" title="Detalhes do Agendamento">
					<p className="text-sm text-muted-foreground">Carregando...</p>
				</ResponsiveDialogContent>
			</ResponsiveDialog>
		)
	}

	const isCancelled = appointment.status === 'cancelled'
	const dateFormatted = formatDateInSaoPaulo(appointment.appointmentDate, {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent
				size="md"
				title="Detalhes do Agendamento"
				description={`Agendamento de ${appointment.name}`}
			>
				<div className="space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
					{isCancelled && (
						<Badge variant="destructive" className="w-fit">
							Cancelado
							{appointment.cancelReason
								? ` — ${appointment.cancelReason}`
								: ''}
						</Badge>
					)}

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4 text-muted-foreground shrink-0" />
							<div>
								<p className="font-semibold text-sm">{appointment.name}</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Mail className="h-4 w-4 text-muted-foreground shrink-0" />
							<p className="text-sm">{appointment.email}</p>
						</div>

						<div className="flex items-center gap-2">
							<Phone className="h-4 w-4 text-muted-foreground shrink-0" />
							<p className="text-sm">{appointment.phone}</p>
						</div>

						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
							<p className="text-sm">
								{dateFormatted} às {appointment.time}
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
							<p className="text-sm">
								{appointment.service.name} —{' '}
								{formatCurrency(appointment.service.price)} (
								{appointment.service.duration}min)
							</p>
						</div>

						<div className="flex items-center gap-2">
							<Clock className="h-4 w-4 text-muted-foreground shrink-0" />
							<p className="text-sm">{appointment.employee.name}</p>
						</div>
					</div>

					{appointment.history.length > 0 && (
						<div className="border-t pt-3">
							<h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
								Histórico
							</h4>
							<div className="space-y-2">
								{appointment.history.map((entry) => (
									<div
										key={entry.id}
										className="text-xs p-2 rounded bg-muted/50 space-y-0.5"
									>
										<div className="flex items-center justify-between">
											<span className="font-medium">
												{ACTION_LABELS[entry.action] || entry.action}
											</span>
											<span className="text-muted-foreground">
												{PERFORMER_LABELS[entry.performedBy] ||
													entry.performedBy}
											</span>
										</div>
										{entry.reason && (
											<p className="text-muted-foreground">
												Motivo: {entry.reason}
											</p>
										)}
										<p className="text-muted-foreground">
											{new Date(entry.createdAt).toLocaleString('pt-BR', {
												timeZone: 'America/Sao_Paulo',
											})}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
					<Button
						variant="outline"
						size="sm"
						onClick={onEdit}
						disabled={isCancelled}
						className="min-h-[44px] flex-1"
						aria-label="Editar agendamento"
					>
						<Pencil className="mr-2 h-4 w-4" />
						Editar
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={onReschedule}
						disabled={isCancelled}
						className="min-h-[44px] flex-1"
						aria-label="Reagendar agendamento"
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Reagendar
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={onCancel}
						disabled={isCancelled}
						className="min-h-[44px] flex-1"
						aria-label="Cancelar agendamento"
					>
						<X className="mr-2 h-4 w-4" />
						Cancelar
					</Button>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
