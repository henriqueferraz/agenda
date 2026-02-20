/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Formulário de criação e edição de feriado (Stop Day). Campos: data e motivo.
 * Em edição recebe initialDate/initialMotivation; verifica agendamentos na data
 * via getAppointmentsForDate e exibe alerta se houver. Salva via createStopDay ou updateStopDay.
 *
 * @example
 * ```tsx
 * <FormStopDay userId={userId} onSuccess={loadStopDays} />
 * <FormStopDay userId={userId} stopDayId={id} initialDate={d} initialMotivation={m} onSuccess={loadStopDays} onCancel={handleCancelEdit} />
 * ```
 */
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createStopDay } from '../_actions/create-stopday'
import { updateStopDay } from '../_actions/update-stopday'
import { getAppointmentsForDate } from '../_data-access/get-appointments-for-date'
interface FormStopDayProps {
	userId: string
	stopDayId?: string
	initialDate?: Date
	initialMotivation?: string
	onSuccess?: () => void
	onCancel?: () => void
}
export const FormStopDay = ({
	userId,
	stopDayId,
	initialDate,
	initialMotivation,
	onSuccess,
	onCancel,
}: FormStopDayProps) => {
	const [date, setDate] = useState<string>(() => {
		if (initialDate) {
			const year = initialDate.getFullYear()
			const month = String(initialDate.getMonth() + 1).padStart(2, '0')
			const day = String(initialDate.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
		return ''
	})
	const [motivation, setMotivation] = useState<string>(initialMotivation || '')
	const [isLoading, setIsLoading] = useState(false)
	const [isCheckingAppointments, setIsCheckingAppointments] = useState(false)
	const [appointments, setAppointments] = useState<
		Array<{
			id: string
			name: string
			email: string
			phone: string
			time: string
			service: {
				id: string
				name: string
			}
			employee: {
				id: string
				name: string
			}
		}>
	>([])
	// Atualiza o estado quando as props mudam (modo de edição)
	useEffect(() => {
		if (initialDate) {
			const year = initialDate.getFullYear()
			const month = String(initialDate.getMonth() + 1).padStart(2, '0')
			const day = String(initialDate.getDate()).padStart(2, '0')
			setDate(`${year}-${month}-${day}`)
		} else {
			setDate('')
		}
		setMotivation(initialMotivation || '')
	}, [initialDate, initialMotivation])
	// Verifica agendamentos quando a data muda
	useEffect(() => {
		if (date) {
			checkAppointments()
		} else {
			setAppointments([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [date])
	const checkAppointments = async () => {
		if (!date) return
		setIsCheckingAppointments(true)
		try {
			const selectedDate = new Date(date + 'T00:00:00')
			const apts = await getAppointmentsForDate({ userId, date: selectedDate })
			setAppointments(apts)
		} catch (error) {
			console.error('Erro ao verificar agendamentos:', error)
		} finally {
			setIsCheckingAppointments(false)
		}
	}
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!date) {
			toast.error('Selecione uma data')
			return
		}
		if (!motivation.trim()) {
			toast.error('Informe o motivo do feriado')
			return
		}
		setIsLoading(true)
		try {
			const selectedDate = new Date(date + 'T00:00:00')
			if (stopDayId) {
				// Atualizar
				const result = await updateStopDay({
					id: stopDayId,
					userId,
					date: selectedDate,
					motivation: motivation.trim(),
				})
				if (result.success) {
					toast.success(result.message || 'Feriado atualizado com sucesso!')
					if (onSuccess) onSuccess()
				} else {
					toast.error(result.error || 'Erro ao atualizar feriado')
				}
			} else {
				// Criar
				const result = await createStopDay({
					userId,
					date: selectedDate,
					motivation: motivation.trim(),
				})
				if (result.success) {
					toast.success(result.message || 'Feriado criado com sucesso!')
					setDate('')
					setMotivation('')
					setAppointments([])
					if (onSuccess) onSuccess()
				} else {
					toast.error(result.error || 'Erro ao criar feriado')
				}
			}
		} catch (error) {
			console.error('Erro ao salvar feriado:', error)
			toast.error('Erro inesperado ao salvar feriado')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Calendar className='h-5 w-5' />
					{stopDayId ? 'Editar Feriado' : 'Novo Feriado'}
				</CardTitle>
				<CardDescription>
					Configure um dia em que a empresa não funcionará
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='date'>Data</Label>
						<Input
							id='date'
							type='date'
							value={date}
							onChange={(e) => setDate(e.target.value)}
							required
							min={new Date().toISOString().split('T')[0]}
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='motivation'>Motivo</Label>
						<Textarea
							id='motivation'
							value={motivation}
							onChange={(e) => setMotivation(e.target.value)}
							placeholder='Ex: Feriado Nacional, Manutenção, Evento...'
							required
							rows={3}
							maxLength={500}
						/>
						<p className='text-sm text-muted-foreground'>
							{motivation.length}/500 caracteres
						</p>
					</div>

					{/* Alerta de agendamentos existentes */}
					{isCheckingAppointments ? (
						<div className='flex items-center gap-2 text-sm text-muted-foreground'>
							<Loader2 className='h-4 w-4 animate-spin' />
							Verificando agendamentos...
						</div>
					) : (
						appointments.length > 0 && (
							<Alert variant='destructive'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>
									<strong>Atenção!</strong> Existem {appointments.length}{' '}
									agendamento(s) marcado(s) para esta data:
									<ul className='mt-2 ml-4 list-disc space-y-1'>
										{appointments.map((apt) => (
											<li key={apt.id}>
												{apt.time} - {apt.name} ({apt.service.name} com{' '}
												{apt.employee.name})
											</li>
										))}
									</ul>
									<p className='mt-2 text-sm'>
										O feriado será criado mesmo assim. Considere cancelar ou
										reagendar esses agendamentos.
									</p>
								</AlertDescription>
							</Alert>
						)
					)}

					<div className='flex gap-2'>
					<Button
						type='submit'
						disabled={isLoading || isCheckingAppointments}
						className='flex-1 min-h-[44px]'
					>
							{isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							{stopDayId ? 'Atualizar' : 'Criar'}
						</Button>
						{onCancel && (
						<Button
							type='button'
							variant='outline'
							onClick={onCancel}
							disabled={isLoading}
							className='min-h-[44px]'
						>
								Cancelar
							</Button>
						)}
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
