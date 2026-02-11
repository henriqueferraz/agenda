/**
 * Componente - Modal Employee Times
 *
 * Visao geral:
 * - Componente React para Modal Employee Times.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Renderizar UI com props previsiveis.
 * - Isolar estilos e comportamento do componente.
 * - Facilitar reutilizacao em outras telas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/_components/modal-employee-times";
 *
 * // Uso conforme o fluxo da aplicacao.
 *
 * @example
 * ```tsx
 * <ModalEmployeeTimes employee={employee} open={open} onOpenChange={setOpen} userId={userId} />
 * ```
 */
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Clock, Copy, MoreVertical } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { updateEmployeeTimes } from '../_actions/update-employee-times'
import { getCompanyTimes } from '../_data-access/get-company-times'
import { EmployeeModel as Employee } from '@/lib/generated/prisma/models'
/** Props do modal de horários do funcionário (ModalEmployeeTimes). */
interface ModalEmployeeTimesProps {
	/** Funcionário cujos horários serão configurados. */
	employee: Employee
	/** Controla se o modal está aberto. */
	open: boolean
	/** Callback ao abrir/fechar o modal. */
	onOpenChange: (open: boolean) => void
	/** ID do usuário (empresa) para carregar horários da empresa. */
	userId: string
}
// Mapeamento dos dias da semana
const DAYS_CONFIG = [
	{ key: 'mon_times', label: 'Segunda-feira', shortLabel: 'Seg' },
	{ key: 'tue_times', label: 'Terça-feira', shortLabel: 'Ter' },
	{ key: 'wed_times', label: 'Quarta-feira', shortLabel: 'Qua' },
	{ key: 'thu_times', label: 'Quinta-feira', shortLabel: 'Qui' },
	{ key: 'fri_times', label: 'Sexta-feira', shortLabel: 'Sex' },
	{ key: 'sat_times', label: 'Sábado', shortLabel: 'Sáb' },
	{ key: 'sun_times', label: 'Domingo', shortLabel: 'Dom' },
] as const
type DayKey = (typeof DAYS_CONFIG)[number]['key']
interface CompanyTimes {
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
}
/**
 * Modal de horários do funcionário por dia; seleção e cópia entre dias.
 * @param props - ModalEmployeeTimesProps
 * @returns JSX.Element
 */
export const ModalEmployeeTimes = ({
	employee,
	open,
	onOpenChange,
	userId,
}: ModalEmployeeTimesProps) => {
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingCompanyTimes, setIsLoadingCompanyTimes] = useState(false)
	const [companyTimes, setCompanyTimes] = useState<CompanyTimes | null>(null)
	const [employeeTimes, setEmployeeTimes] = useState<Record<DayKey, string[]>>({
		mon_times: employee.mon_times || [],
		tue_times: employee.tue_times || [],
		wed_times: employee.wed_times || [],
		thu_times: employee.thu_times || [],
		fri_times: employee.fri_times || [],
		sat_times: employee.sat_times || [],
		sun_times: employee.sun_times || [],
	})
	// Atualiza os horários do funcionário quando o employee muda
	useEffect(() => {
		setEmployeeTimes({
			mon_times: employee.mon_times || [],
			tue_times: employee.tue_times || [],
			wed_times: employee.wed_times || [],
			thu_times: employee.thu_times || [],
			fri_times: employee.fri_times || [],
			sat_times: employee.sat_times || [],
			sun_times: employee.sun_times || [],
		})
	}, [employee])
	// Carrega os horários da empresa quando o modal abre
	useEffect(() => {
		if (open && !companyTimes) {
			loadCompanyTimes()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])
	const loadCompanyTimes = async () => {
		setIsLoadingCompanyTimes(true)
		try {
			const times = await getCompanyTimes({ userId })
			if (times) {
				setCompanyTimes(times)
			} else {
				toast.error('Erro ao carregar horários da empresa.')
			}
		} catch (error) {
			console.error('Erro ao carregar horários da empresa:', error)
			toast.error('Erro ao carregar horários da empresa.')
		} finally {
			setIsLoadingCompanyTimes(false)
		}
	}
	const toggleTime = (dayKey: DayKey, time: string) => {
		const currentTimes = employeeTimes[dayKey] || []
		const isSelected = currentTimes.includes(time)
		setEmployeeTimes((prev) => ({
			...prev,
			[dayKey]: isSelected
				? currentTimes.filter((t) => t !== time)
				: [...currentTimes, time].sort(),
		}))
	}
	const handleSave = async () => {
		setIsLoading(true)
		try {
			const result = await updateEmployeeTimes({
				employeeId: employee.id,
				...employeeTimes,
			})
			if (result.success) {
				toast.success(result.message || 'Horários atualizados com sucesso!')
				onOpenChange(false)
				// Recarregar a página para atualizar a lista
				window.location.reload()
			} else {
				toast.error(result.error || 'Erro ao atualizar horários')
			}
		} catch (error) {
			console.error('Erro ao salvar horários:', error)
			toast.error('Erro inesperado. Tente novamente.')
		} finally {
			setIsLoading(false)
		}
	}
	const getAvailableTimes = (dayKey: DayKey): string[] => {
		if (!companyTimes) return []
		return companyTimes[dayKey] || []
	}
	const getSelectedTimes = (dayKey: DayKey): string[] => {
		return employeeTimes[dayKey] || []
	}
	const hasTimesConfigured = (dayKey: DayKey): boolean => {
		return getSelectedTimes(dayKey).length > 0
	}
	const copyTimesToDay = (sourceDayKey: DayKey, targetDayKey: DayKey) => {
		const sourceTimes = getSelectedTimes(sourceDayKey)
		if (sourceTimes.length === 0) {
			toast.warning(
				`Não há horários configurados em ${DAYS_CONFIG.find((d) => d.key === sourceDayKey)?.label}`,
			)
			return
		}
		// Filtrar apenas os horários que estão disponíveis no dia de destino
		const availableTimes = getAvailableTimes(targetDayKey)
		const validTimes = sourceTimes.filter((time) =>
			availableTimes.includes(time),
		)
		if (validTimes.length === 0) {
			toast.warning(
				'Nenhum dos horários do dia de origem está disponível no dia de destino.',
			)
			return
		}
		setEmployeeTimes((prev) => ({
			...prev,
			[targetDayKey]: [...validTimes].sort(),
		}))
		const sourceLabel = DAYS_CONFIG.find((d) => d.key === sourceDayKey)?.label
		const targetLabel = DAYS_CONFIG.find((d) => d.key === targetDayKey)?.label
		toast.success(`Horários de ${sourceLabel} copiados para ${targetLabel}`)
	}
	const copyTimesToAllDays = (sourceDayKey: DayKey) => {
		const sourceTimes = getSelectedTimes(sourceDayKey)
		if (sourceTimes.length === 0) {
			toast.warning(
				`Não há horários configurados em ${DAYS_CONFIG.find((d) => d.key === sourceDayKey)?.label}`,
			)
			return
		}
		const updatedTimes: Record<DayKey, string[]> = { ...employeeTimes }
		DAYS_CONFIG.forEach((day) => {
			if (day.key !== sourceDayKey) {
				const availableTimes = getAvailableTimes(day.key)
				const validTimes = sourceTimes.filter((time) =>
					availableTimes.includes(time),
				)
				if (validTimes.length > 0) {
					updatedTimes[day.key] = [...validTimes].sort()
				}
			}
		})
		setEmployeeTimes(updatedTimes)
		const sourceLabel = DAYS_CONFIG.find((d) => d.key === sourceDayKey)?.label
		toast.success(
			`Horários de ${sourceLabel} copiados para todos os outros dias`,
		)
	}
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Clock className='h-5 w-5' />
						Horários de Trabalho - {employee.name}
					</DialogTitle>
					<DialogDescription>
						Selecione os horários que {employee.name} trabalha em cada dia.
						Clique nos botões para selecionar ou desmarcar horários. Apenas os
						horários em que a empresa está aberta estarão disponíveis.
					</DialogDescription>
				</DialogHeader>

				{isLoadingCompanyTimes ? (
					<div className='flex items-center justify-center py-8'>
						<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
						<span className='ml-2 text-sm text-muted-foreground'>
							Carregando horários da empresa...
						</span>
					</div>
				) : !companyTimes ? (
					<div className='text-center py-8 text-muted-foreground'>
						<p>Erro ao carregar horários da empresa.</p>
						<Button
							variant='outline'
							size='sm'
							onClick={loadCompanyTimes}
							className='mt-4'
						>
							Tentar novamente
						</Button>
					</div>
				) : (
					<div className='space-y-6 py-4'>
						{DAYS_CONFIG.map((day) => {
							const availableTimes = getAvailableTimes(day.key)
							const selectedTimes = getSelectedTimes(day.key)
							const hasTimes = hasTimesConfigured(day.key)
							return (
								<div key={day.key} className='space-y-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<h3 className='font-semibold text-sm'>{day.label}</h3>
											{hasTimes ? (
												<Badge
													variant='default'
													className='bg-blue-100 text-blue-800'
												>
													{selectedTimes.length} horário
													{selectedTimes.length !== 1 ? 's' : ''}
												</Badge>
											) : (
												<Badge variant='destructive'>Não trabalha</Badge>
											)}
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													type='button'
													variant='ghost'
													size='sm'
													className='h-8 w-8 p-0'
												>
													<MoreVertical className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Copiar horários</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onClick={() => copyTimesToAllDays(day.key)}
													disabled={!hasTimes}
												>
													<Copy className='mr-2 h-4 w-4' />
													Copiar para todos os dias
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuLabel>
													Copiar de outro dia
												</DropdownMenuLabel>
												{DAYS_CONFIG.filter((d) => d.key !== day.key).map(
													(otherDay) => (
														<DropdownMenuItem
															key={otherDay.key}
															onClick={() =>
																copyTimesToDay(otherDay.key, day.key)
															}
															disabled={!hasTimesConfigured(otherDay.key)}
														>
															<Copy className='mr-2 h-4 w-4' />
															De {otherDay.label}
														</DropdownMenuItem>
													),
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									{availableTimes.length > 0 && (
										<p className='text-sm text-muted-foreground mb-2'>
											Clique nos horários desejados para selecioná-los:
										</p>
									)}

									{availableTimes.length === 0 ? (
										<p className='text-sm text-muted-foreground'>
											A empresa está fechada neste dia.
										</p>
									) : (
										<section className='py-2'>
											<div className='grid grid-cols-4 gap-2 max-h-full overflow-y-auto'>
												{availableTimes.map((time) => {
													const isSelected = selectedTimes.includes(time)
													return (
														<Button
															key={time}
															type='button'
															className={cn(
																'w-full text-xs',
																isSelected &&
																'border-2 border-blue-600 bg-blue-50 text-primary font-medium',
															)}
															variant='outline'
															onClick={() => toggleTime(day.key, time)}
															size='sm'
														>
															{time}
														</Button>
													)
												})}
											</div>
										</section>
									)}
								</div>
							)
						})}
					</div>
				)}

				<DialogFooter>
					<Button
						type='button'
						variant='outline'
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancelar
					</Button>
					<Button
						type='button'
						onClick={handleSave}
						disabled={isLoading || isLoadingCompanyTimes}
					>
						{isLoading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Salvando...
							</>
						) : (
							'Salvar Horários'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
