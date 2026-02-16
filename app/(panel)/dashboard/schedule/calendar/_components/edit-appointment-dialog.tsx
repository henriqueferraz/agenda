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
 * Permite alterar serviço, funcionário, data e horário.
 * Chama updateAppointment server action e exibe toast de resultado.
 *
 * @example
 * <EditAppointmentDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   appointment={appointment}
 *   services={services}
 *   employees={employees}
 *   onSuccess={handleReload}
 * />
 */
'use client'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
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
	/** Callback executado após edição bem-sucedida. */
	onSuccess: () => void
}

/**
 * Dialog de edição com selects de serviço, funcionário, data e horário.
 * Filtra funcionários que realizam o serviço selecionado.
 *
 * @param props - open, onOpenChange, appointment, services, employees, onSuccess
 * @returns JSX.Element do dialog
 */
export const EditAppointmentDialog = ({
	open,
	onOpenChange,
	appointment,
	services,
	employees,
	onSuccess,
}: EditAppointmentDialogProps): React.JSX.Element => {
	const [serviceId, setServiceId] = useState(appointment.serviceId)
	const [employeeId, setEmployeeId] = useState(appointment.employeeId)
	const [dateStr, setDateStr] = useState(appointment.currentDateStr)
	const [time, setTime] = useState(appointment.currentTime)
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		setServiceId(appointment.serviceId)
		setEmployeeId(appointment.employeeId)
		setDateStr(appointment.currentDateStr)
		setTime(appointment.currentTime)
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

		setIsLoading(true)
		try {
			const updateData: Record<string, unknown> = {
				appointmentId: appointment.id,
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
							<Select value={serviceId} onValueChange={setServiceId}>
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
							<Select value={employeeId} onValueChange={setEmployeeId}>
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

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="edit-date">Data</Label>
								<Input
									id="edit-date"
									type="date"
									value={dateStr}
									onChange={(e) => setDateStr(e.target.value)}
									min={todayStr}
									className="min-h-[44px]"
									aria-label="Selecionar data"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="edit-time">Horário</Label>
								<Input
									id="edit-time"
									type="time"
									value={time}
									onChange={(e) => setTime(e.target.value)}
									className="min-h-[44px]"
									aria-label="Selecionar horário"
								/>
							</div>
						</div>
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
							disabled={isLoading || !hasChanges}
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
