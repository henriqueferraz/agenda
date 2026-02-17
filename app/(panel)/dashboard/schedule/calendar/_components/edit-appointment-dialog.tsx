/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Dialog de edição de agendamento (F-02).
 * Permite alterar serviço, funcionário, data e horário (grade de disponíveis).
 * Busca agendamentos existentes e calcula horários livres por funcionário.
 * Chama updateAppointment server action e exibe toast de resultado.
 *
 * @example
 * <EditAppointmentDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   appointment={appointment}
 *   services={services}
 *   employees={employees}
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
} from '@/components/responsive-dialog'
import { updateAppointment } from '../_actions/update-appointment'
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

/** Serviço disponível para seleção. */
interface ServiceOption {
	/** ID do serviço. */
	id: string
	/** Nome do serviço. */
	name: string
	/** Duração em minutos. */
	duration: number
	/** Preço em centavos. */
	price: number
}

/** Funcionário disponível para seleção. */
interface EmployeeOption {
	/** ID do funcionário. */
	id: string
	/** Nome do funcionário. */
	name: string
	/** IDs dos serviços que realiza. */
	serviceIds: string[]
}

/** Dados do agendamento atual para pré-preencher o formulário. */
interface AppointmentData {
	/** ID do agendamento. */
	id: string
	/** Nome do cliente. */
	name: string
	/** ID do serviço atual. */
	serviceId: string
	/** ID do funcionário atual. */
	employeeId: string
	/** Data atual no formato YYYY-MM-DD. */
	currentDateStr: string
	/** Horário atual no formato HH:MM. */
	currentTime: string
}

/** Props do EditAppointmentDialog. */
interface EditAppointmentDialogProps {
	/** Se o dialog está aberto. */
	open: boolean
	/** Callback de mudança de estado. */
	onOpenChange: (open: boolean) => void
	/** Dados do agendamento a editar. */
	appointment: AppointmentData
	/** Lista de serviços disponíveis. */
	services: ServiceOption[]
	/** Lista de funcionários disponíveis. */
	employees: EmployeeOption[]
	/** ID do usuário (empresa). */
	userId: string
	/** Horários de funcionamento da empresa. */
	companyTimes: CompanyTimes | null
	/** Callback executado após edição bem-sucedida. */
	onSuccess: () => void
}

/**
 * Dialog de edição com selects de serviço, funcionário, data e grade de horários disponíveis.
 * Filtra funcionários que realizam o serviço selecionado.
 * Busca agendamentos existentes e calcula horários livres por funcionário.
 *
 * @param props - open, onOpenChange, appointment, services, employees, userId, companyTimes, onSuccess
 * @returns JSX.Element do dialog
 */
export const EditAppointmentDialog = ({
	open,
	onOpenChange,
	appointment,
	services,
	employees,
	userId,
	companyTimes,
	onSuccess,
}: EditAppointmentDialogProps): React.JSX.Element => {
	const [serviceId, setServiceId] = useState(appointment.serviceId)
	const [employeeId, setEmployeeId] = useState(appointment.employeeId)
	const [dateStr, setDateStr] = useState(appointment.currentDateStr)
	const [time, setTime] = useState(appointment.currentTime)
	const [reason, setReason] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingTimes, setIsLoadingTimes] = useState(false)
	const [availableTimes, setAvailableTimes] = useState<string[]>([])

	useEffect(() => {
		setServiceId(appointment.serviceId)
		setEmployeeId(appointment.employeeId)
		setDateStr(appointment.currentDateStr)
		setTime(appointment.currentTime)
		setReason('')
	}, [appointment])

	const filteredEmployees = employees.filter((emp) =>
		emp.serviceIds.includes(serviceId),
	)

	useEffect(() => {
		if (
			serviceId !== appointment.serviceId &&
			!filteredEmployees.some((e) => e.id === employeeId)
		) {
			setEmployeeId(filteredEmployees[0]?.id ?? '')
		}
	}, [serviceId, filteredEmployees, employeeId, appointment.serviceId])

	/** Duração do serviço selecionado. */
	const selectedServiceDuration = services.find((s) => s.id === serviceId)?.duration ?? 30

	/**
	 * Carrega horários disponíveis para a data e funcionário selecionados.
	 * Filtra horários ocupados pelo funcionário (exceto o agendamento atual).
	 */
	const loadAvailableTimes = useCallback(async (
		targetDateStr: string,
		targetEmployeeId: string,
		targetServiceDuration: number,
	) => {
		if (!targetDateStr || !targetEmployeeId || !companyTimes || !userId) {
			setAvailableTimes([])
			return
		}

		setIsLoadingTimes(true)
		try {
			const [year, month, day] = targetDateStr.split('-').map(Number)
			const dateObj = new Date(year, month - 1, day)
			const dayOfWeek = dateObj.getDay()
			const dayKey = DAYS_MAP[dayOfWeek]

			const companyTimesForDay = dayKey ? companyTimes[dayKey] ?? [] : []

			if (companyTimesForDay.length === 0) {
				setAvailableTimes([])
				return
			}

			const existingAppointments = await getDayAppointments({ userId, date: dateObj })

			// Calcula horários ocupados pelo funcionário (exceto o agendamento atual)
			const occupiedTimes = new Set<string>()
			existingAppointments.forEach((apt) => {
				if (apt.id === appointment.id) return
				if (apt.status === 'cancelled') return
				if (apt.employeeId !== targetEmployeeId) return

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
			const available = companyTimesForDay.filter((t) => {
				if (occupiedTimes.has(t)) return false

				const [h, m] = t.split(':').map(Number)
				let currentMinutes = h * 60 + m + 30
				const endMinutes = h * 60 + m + targetServiceDuration

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
	}, [companyTimes, userId, appointment.id])

	// Recarrega horários quando data, funcionário ou serviço muda
	useEffect(() => {
		if (open && dateStr && employeeId) {
			loadAvailableTimes(dateStr, employeeId, selectedServiceDuration)
		}
	}, [open, dateStr, employeeId, selectedServiceDuration, loadAvailableTimes])

	const hasChanges =
		serviceId !== appointment.serviceId ||
		employeeId !== appointment.employeeId ||
		dateStr !== appointment.currentDateStr ||
		time !== appointment.currentTime

	const handleUpdate = async (): Promise<void> => {
		if (!hasChanges) {
			toast.info('Nenhuma alteração detectada.')
			return
		}

		if (!reason.trim()) {
			toast.error('Informe o motivo da alteração.')
			return
		}

		setIsLoading(true)
		try {
			const updateData: Record<string, unknown> = {
				appointmentId: appointment.id,
				reason: reason.trim(),
			}

			if (serviceId !== appointment.serviceId) {
				updateData.serviceId = serviceId
			}
			if (employeeId !== appointment.employeeId) {
				updateData.employeeId = employeeId
			}
			if (dateStr !== appointment.currentDateStr) {
				const [year, month, day] = dateStr.split('-').map(Number)
				updateData.appointmentDate = new Date(year, month - 1, day)
			}
			if (time !== appointment.currentTime) {
				updateData.time = time
			}

			const result = await updateAppointment(
				updateData as Parameters<typeof updateAppointment>[0],
			)

			if (result.success) {
				toast.success(result.message || 'Agendamento atualizado.')
				setReason('')
				onOpenChange(false)
				onSuccess()
			} else {
				toast.error(result.error || 'Erro ao atualizar.')
			}
		} catch {
			toast.error('Erro inesperado ao atualizar agendamento.')
		} finally {
			setIsLoading(false)
		}
	}

	const todayStr = new Date().toISOString().split('T')[0]

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent
				size="md"
				title="Editar Agendamento"
				description={`Editando agendamento de ${appointment.name}`}
			>
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-3">
						<div className="space-y-2">
							<Label htmlFor="edit-service">Serviço</Label>
							<Select value={serviceId} onValueChange={(val) => {
								setServiceId(val)
								setTime('')
							}}>
								<SelectTrigger
									id="edit-service"
									className="min-h-[44px]"
									aria-label="Selecionar serviço"
								>
									<SelectValue placeholder="Selecione o serviço" />
								</SelectTrigger>
								<SelectContent>
									{services.map((svc) => (
										<SelectItem key={svc.id} value={svc.id}>
											{svc.name} ({svc.duration}min)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-employee">Funcionário</Label>
							<Select value={employeeId} onValueChange={(val) => {
								setEmployeeId(val)
								setTime('')
							}}>
								<SelectTrigger
									id="edit-employee"
									className="min-h-[44px]"
									aria-label="Selecionar funcionário"
								>
									<SelectValue placeholder="Selecione o funcionário" />
								</SelectTrigger>
								<SelectContent>
									{filteredEmployees.map((emp) => (
										<SelectItem key={emp.id} value={emp.id}>
											{emp.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-date">Data</Label>
							<Input
								id="edit-date"
								type="date"
								value={dateStr}
								onChange={(e) => {
									setDateStr(e.target.value)
									setTime('')
								}}
								min={todayStr}
								className="min-h-[44px]"
								aria-label="Selecionar data"
							/>
						</div>

						{dateStr && employeeId && (
							<div className="space-y-2">
								<Label className="flex items-center gap-1.5">
									<Clock className="h-4 w-4" />
									Horário
								</Label>

								{isLoadingTimes ? (
									<div className="flex items-center justify-center py-6">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
										<span className="ml-2 text-sm text-muted-foreground">Carregando horários...</span>
									</div>
								) : availableTimes.length === 0 ? (
									<p className="text-sm text-muted-foreground py-4 text-center">
										Nenhum horário disponível nesta data para este funcionário.
									</p>
								) : (
									<div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 sm:max-h-64 overflow-y-auto p-1 rounded-md border bg-background">
										{availableTimes.map((t) => (
											<Button
												key={t}
												type="button"
												variant={time === t ? 'default' : 'outline'}
												size="sm"
												onClick={() => setTime(t)}
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
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-reason">
							Motivo da Alteração <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id="edit-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Informe o motivo da alteração..."
							maxLength={500}
							rows={3}
							className="min-h-[80px] resize-none"
							aria-label="Motivo da alteração"
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
							aria-label="Voltar sem salvar"
						>
							Voltar
						</Button>
						<Button
							onClick={handleUpdate}
							disabled={isLoading || !hasChanges || !reason.trim()}
							className="min-h-[44px]"
							aria-label="Salvar alterações do agendamento"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Salvando...
								</>
							) : (
								'Salvar Alterações'
							)}
						</Button>
					</div>
				</div>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}
