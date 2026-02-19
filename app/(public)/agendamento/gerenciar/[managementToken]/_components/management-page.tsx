/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Componente principal da página de autogestão do cliente (F-08).
 * Exibe detalhes do agendamento e botões para cancelar ou reagendar.
 * Mobile-first, sem login, acessado via managementToken.
 *
 * @example
 * <ManagementPage appointment={appointmentData} />
 */
'use client'
import React, { useState, useTransition } from 'react'
import {
	Calendar,
	Clock,
	MapPin,
	Scissors,
	User,
	Phone,
	Mail,
	XCircle,
	CalendarClock,
	CheckCircle2,
	Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ManagementAppointmentData } from '../_data-access/get-appointment-by-management-token'
import { cancelAppointmentPublic } from '../_actions/cancel-appointment-public'
import { rescheduleAppointmentPublic } from '../_actions/reschedule-appointment-public'
import { RescheduleFlow } from './reschedule-flow'

/** Props do ManagementPage. */
interface ManagementPageProps {
	/** Dados completos do agendamento com relações. */
	appointment: ManagementAppointmentData
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/YYYY).
 * @param date - Data a formatar
 * @returns String formatada
 */
const formatDate = (date: Date): string => {
	const d = new Date(date)
	return d.toLocaleDateString('pt-BR', {
		timeZone: 'America/Sao_Paulo',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

/**
 * Formata preço em centavos para reais.
 * @param cents - Valor em centavos
 * @returns String formatada (ex: R$ 42,00)
 */
const formatPrice = (cents: number): string =>
	new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(cents / 100)

/**
 * Monta string do endereço a partir do objeto de endereço.
 * @param address - Objeto com campos de endereço ou null
 * @returns String do endereço formatado ou null se vazio
 */
const formatAddress = (address: ManagementAppointmentData['address']): string | null => {
	if (!address) return null
	const parts = [
		address.street,
		address.number ? `, ${address.number}` : '',
		address.complement ? ` - ${address.complement}` : '',
		address.neighborhood ? ` - ${address.neighborhood}` : '',
		address.city && address.state ? `, ${address.city}/${address.state}` : '',
	].filter(Boolean)
	const full = parts.join('')
	return full.length > 3 ? full : null
}

/**
 * Página de autogestão do agendamento (F-08). Exibe:
 * - Detalhes do agendamento (data, hora, serviço, profissional, endereço)
 * - Botão "Cancelar" com confirmação e campo de motivo
 * - Botão "Reagendar" com seletor de data e horários disponíveis
 * - Feedback visual após ação (sucesso/erro)
 *
 * @param props - Dados do agendamento
 * @returns JSX.Element
 */
export const ManagementPage = ({ appointment }: ManagementPageProps): React.ReactElement => {
	const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [showReschedule, setShowReschedule] = useState(false)
	const [cancelReason, setCancelReason] = useState('')
	const [isPending, startTransition] = useTransition()
	const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

	const companyName = appointment.user.be_called ?? appointment.user.name ?? 'Empresa'
	const addressStr = formatAddress(appointment.address)

	const handleCancel = (): void => {
		startTransition(async () => {
			const response = await cancelAppointmentPublic({
				managementToken: appointment.managementToken,
				reason: cancelReason || undefined,
			})
			setShowCancelDialog(false)
			setResult({
				type: response.success ? 'success' : 'error',
				message: response.success
					? response.message ?? 'Agendamento cancelado com sucesso.'
					: response.error ?? 'Erro ao cancelar.',
			})
		})
	}

	const handleRescheduleConfirm = (newDate: Date, newTime: string): void => {
		startTransition(async () => {
			const response = await rescheduleAppointmentPublic({
				managementToken: appointment.managementToken,
				newDate,
				newTime,
			})
			setShowReschedule(false)
			setResult({
				type: response.success ? 'success' : 'error',
				message: response.success
					? response.message ?? 'Agendamento reagendado com sucesso.'
					: response.error ?? 'Erro ao reagendar.',
			})
		})
	}

	if (result) {
		const isSuccess = result.type === 'success'
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
				<div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg sm:p-8">
					<div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
						{isSuccess ? (
							<CheckCircle2 className="h-8 w-8 text-green-500 sm:h-10 sm:w-10" />
						) : (
							<XCircle className="h-8 w-8 text-red-500 sm:h-10 sm:w-10" />
						)}
					</div>
					<h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
						{isSuccess ? 'Tudo certo!' : 'Ops!'}
					</h1>
					<p className="text-sm text-gray-600 sm:text-base">
						{result.message}
					</p>
				</div>
			</div>
		)
	}

	if (showReschedule) {
		return (
			<RescheduleFlow
				appointment={appointment}
				onConfirm={handleRescheduleConfirm}
				onCancel={() => setShowReschedule(false)}
				isPending={isPending}
			/>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<Card className="w-full max-w-lg shadow-lg">
				<CardHeader className="pb-3 text-center sm:pb-4">
					<CardTitle className="text-xl font-bold text-gray-900 sm:text-2xl">
						Seu Agendamento
					</CardTitle>
					<p className="text-sm text-gray-500">
						{companyName}
					</p>
				</CardHeader>

				<CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
					<div className="space-y-3 rounded-xl bg-gray-50 p-4">
						<div className="flex items-center gap-3">
							<Calendar className="h-5 w-5 shrink-0 text-blue-600" />
							<div>
								<p className="text-xs text-gray-500">Data</p>
								<p className="font-semibold text-gray-900">
									{formatDate(appointment.appointmentDate)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Clock className="h-5 w-5 shrink-0 text-blue-600" />
							<div>
								<p className="text-xs text-gray-500">Horário</p>
								<p className="font-semibold text-gray-900">
									{appointment.time} ({appointment.service.duration} min)
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<Scissors className="h-5 w-5 shrink-0 text-blue-600" />
							<div>
								<p className="text-xs text-gray-500">Serviço</p>
								<p className="font-semibold text-gray-900">
									{appointment.service.name} — {formatPrice(appointment.service.price)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<User className="h-5 w-5 shrink-0 text-blue-600" />
							<div>
								<p className="text-xs text-gray-500">Profissional</p>
								<p className="font-semibold text-gray-900">
									{appointment.employee.name}
								</p>
							</div>
						</div>

						{addressStr && (
							<div className="flex items-start gap-3">
								<MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
								<div>
									<p className="text-xs text-gray-500">Endereço</p>
									<p className="text-sm font-medium text-gray-900">
										{addressStr}
									</p>
								</div>
							</div>
						)}
					</div>

					<div className="space-y-3 rounded-xl bg-blue-50 p-4">
						<div className="flex items-center gap-3">
							<User className="h-5 w-5 shrink-0 text-blue-600" />
							<div>
								<p className="text-xs text-gray-500">Cliente</p>
								<p className="font-semibold text-gray-900">{appointment.name}</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Phone className="h-5 w-5 shrink-0 text-blue-600" />
							<p className="text-sm text-gray-700">{appointment.phone}</p>
						</div>
						<div className="flex items-center gap-3">
							<Mail className="h-5 w-5 shrink-0 text-blue-600" />
							<p className="text-sm text-gray-700">{appointment.email}</p>
						</div>
					</div>

					<div className="flex flex-col gap-3 pt-2 sm:flex-row">
						<Button
							variant="outline"
							className="min-h-[44px] flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
							onClick={() => setShowCancelDialog(true)}
							disabled={isPending}
							aria-label="Cancelar agendamento"
						>
							<XCircle className="mr-2 h-4 w-4" />
							Cancelar
						</Button>

						<Button
							className="min-h-[44px] flex-1 bg-blue-600 hover:bg-blue-700"
							onClick={() => setShowReschedule(true)}
							disabled={isPending}
							aria-label="Reagendar agendamento"
						>
							<CalendarClock className="mr-2 h-4 w-4" />
							Reagendar
						</Button>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
						<AlertDialogDescription>
							Essa ação não pode ser desfeita. O profissional será notificado
							sobre o cancelamento.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<div className="py-2">
						<Label htmlFor="cancel-reason" className="text-sm text-gray-700">
							Motivo (opcional)
						</Label>
						<Textarea
							id="cancel-reason"
							placeholder="Informe o motivo do cancelamento..."
							value={cancelReason}
							onChange={(e) => setCancelReason(e.target.value)}
							className="mt-1.5"
							maxLength={500}
							rows={3}
						/>
					</div>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>
							Voltar
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancel}
							disabled={isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Cancelando...
								</>
							) : (
								'Confirmar cancelamento'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
