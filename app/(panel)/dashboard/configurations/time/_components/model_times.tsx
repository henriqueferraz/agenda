/**
 * Componente - Model Times
 *
 * Visao geral:
 * - Componente React para Model Times.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/time/_components/model_times";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import {
	FormTimesData,
	useFormTimes,
} from '@/app/(panel)/dashboard/configurations/time/_components/form_times'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Form } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Prisma } from '@/lib/generated/prisma/client'
import { updateTimes } from '../_actions/update-times'
import { toast } from 'sonner'
import { useCallback, useEffect, useState } from 'react'
import { Clock, Edit, Copy, CopyCheck, Trash2 } from 'lucide-react'
import { sortTimes, removeDuplicateTimes } from './form_times'
import { Horario } from '../horario'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Tipo do usuário com dados de horários incluídos
type UserWithTimes = Prisma.UserGetPayload<{
	include: {
		subscription: true
	}
}>
interface ModelTimesProps {
	/** Dados do usuário para preenchimento inicial */
	user: UserWithTimes
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
export const ModelTimes = ({ user }: ModelTimesProps) => {
	// Passo 1: inicializar estado local e formulario com dados do usuario.
	// Passo 2: preparar callbacks de atualizacao e validacoes do form.
	// Passo 3: sincronizar salvamento automatico conforme alteracoes.
	// Passo 4: renderizar a UI de configuracao dos horarios.
	const [editingDay, setEditingDay] = useState<string | null>(null)
	const [selectedTimes, setSelectedTimes] = useState<string[]>([])
	const [isModalOpen, setIsModalOpen] = useState(false)
	const form = useFormTimes({
		mon_times: user.mon_times,
		tue_times: user.tue_times,
		wed_times: user.wed_times,
		thu_times: user.thu_times,
		fri_times: user.fri_times,
		sat_times: user.sat_times,
		sun_times: user.sun_times,
	})
	const onSubmit = useCallback(async (values: FormTimesData) => {
		// Passo 1: normalizar o payload com todos os dias preenchidos.
		// Passo 2: enviar a atualizacao para o servidor.
		// Passo 3: tratar mensagens de sucesso ou erro.
		// Preparar dados - todos os dias são incluídos, com arrays vazios para dias sem horários
		const timesData: Record<string, string[]> = {}
		DAYS_CONFIG.forEach((day) => {
			timesData[day.key] = values[day.key as keyof FormTimesData] || []
		})
		const response = await updateTimes(timesData)
		if (response?.error) {
			toast.error(response.error)
		} else {
			toast.success(response.data)
		}
	}, [])
	const areTimesEqual = (
		current: string[] | undefined,
		initial: string[] | undefined,
	) => {
		const normalizedCurrent = current || []
		const normalizedInitial = initial || []
		if (normalizedCurrent.length !== normalizedInitial.length) {
			return false
		}
		return normalizedCurrent.every(
			(value, index) => value === normalizedInitial[index],
		)
	}
	// Observar mudanças no formulário para salvamento automático
	const watchedValues = form.watch()
	// Salvamento automático quando houver mudanças
	useEffect(() => {
		const currentValues = form.getValues()
		const hasChanges = Object.keys(currentValues).some((key) => {
			const current = currentValues[key as keyof FormTimesData]
			const initial = user[key as keyof typeof user] as string[]
			return !areTimesEqual(current, initial)
		})
		if (hasChanges) {
			// Pequeno delay para evitar salvamentos excessivos durante edição
			const timeoutId = setTimeout(() => {
				onSubmit(currentValues)
			}, 1000) // 1 segundo de delay
			return () => clearTimeout(timeoutId)
		}
	}, [form, onSubmit, user, watchedValues])
	// Função auxiliar para verificar se um dia tem horários
	const hasTimes = (dayKey: string): boolean => {
		// Passo 1: recuperar os horarios atuais do dia no formulario.
		// Passo 2: retornar se existe ao menos um horario configurado.
		const times = form.getValues(dayKey as keyof FormTimesData)
		return Boolean(times && times.length > 0)
	}
	const updateDayTimes = (dayKey: string, newTimes: string[]) => {
		// Passo 1: normalizar e ordenar os horarios recebidos.
		// Passo 2: atualizar o estado do formulario.
		// Passo 3: limpar estado do modal e selecao atual.
		// Passo 4: exibir feedback ao usuario.
		try {
			// Substituir completamente os horários do dia
			const updatedTimes = sortTimes(removeDuplicateTimes(newTimes))
			form.setValue(dayKey as keyof FormTimesData, updatedTimes)
			// Forçar re-render dos checkboxes
			form.trigger()
			// Fechar o modal e mostrar mensagem de sucesso
			setIsModalOpen(false)
			setEditingDay(null)
			setSelectedTimes([])
			toast.success(`Horários atualizados com sucesso`)
		} catch {
			toast.error('Erro ao atualizar horários')
		}
	}
	const copyTimesToDay = (sourceDayKey: string, targetDayKey: string) => {
		// Passo 1: ler os horarios do dia de origem.
		// Passo 2: normalizar e aplicar no dia de destino.
		// Passo 3: forcar atualizacao visual dos campos.
		// Passo 4: exibir mensagem de confirmacao.
		try {
			const sourceTimes =
				form.getValues(sourceDayKey as keyof FormTimesData) || []
			const updatedTimes = sortTimes(removeDuplicateTimes(sourceTimes))
			form.setValue(targetDayKey as keyof FormTimesData, updatedTimes)
			// Forçar re-render dos checkboxes
			form.trigger()
			toast.success(
				`Horários copiados de ${DAYS_CONFIG.find((d) => d.key === sourceDayKey)?.shortLabel} para ${DAYS_CONFIG.find((d) => d.key === targetDayKey)?.shortLabel}`,
			)
		} catch {
			toast.error('Erro ao copiar horários')
		}
	}
	const copyTimesToAllDays = (sourceDayKey: string) => {
		// Passo 1: recuperar e normalizar horarios do dia de origem.
		// Passo 2: aplicar horarios em todos os outros dias.
		// Passo 3: atualizar visualmente os checkboxes.
		// Passo 4: confirmar a operacao ao usuario.
		try {
			const sourceTimes =
				form.getValues(sourceDayKey as keyof FormTimesData) || []
			const updatedTimes = sortTimes(removeDuplicateTimes(sourceTimes))
			// Copiar para todos os outros dias
			DAYS_CONFIG.forEach((day) => {
				if (day.key !== sourceDayKey) {
					form.setValue(day.key as keyof FormTimesData, updatedTimes)
				}
			})
			// Forçar re-render dos checkboxes
			form.trigger()
			toast.success(`Horários copiados para todos os dias`)
		} catch {
			toast.error('Erro ao copiar horários para todos os dias')
		}
	}
	const clearDayTimes = (dayKey: string) => {
		// Passo 1: limpar os horarios do dia selecionado.
		// Passo 2: garantir re-render dos checkboxes.
		// Passo 3: informar o usuario do resultado.
		try {
			// Limpar horários do dia (array vazio)
			form.setValue(dayKey as keyof FormTimesData, [])
			// Forçar re-render dos checkboxes
			form.trigger()
			toast.success(
				`${DAYS_CONFIG.find((d) => d.key === dayKey)?.label} definido como fechado`,
			)
		} catch {
			toast.error('Erro ao limpar horários')
		}
	}
	const clearAllTimes = () => {
		// Passo 1: limpar horarios de todos os dias.
		// Passo 2: atualizar estado visual do formulario.
		// Passo 3: informar o usuario do resultado.
		try {
			// Limpar horários de todos os dias
			DAYS_CONFIG.forEach((day) => {
				form.setValue(day.key as keyof FormTimesData, [])
			})
			// Forçar re-render dos checkboxes
			form.trigger()
			toast.success('Todos os dias definidos como fechados')
		} catch {
			toast.error('Erro ao limpar todos os horários')
		}
	}
	const getDayTimes = (dayKey: string): string[] => {
		// Passo 1: ler horarios do dia diretamente do formulario.
		// Passo 2: garantir retorno consistente com array vazio.
		return form.getValues(dayKey as keyof FormTimesData) || []
	}
	return (
		<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
			<Card className='w-full max-w-4xl'>
				<CardHeader className='text-center'>
					<CardTitle className='text-2xl font-bold flex items-center justify-center gap-2'>
						<Clock className='h-6 w-6' />
						Horários de Funcionamento
					</CardTitle>
					<CardDescription className='text-sm'>
						Configure os horários de funcionamento para cada dia da semana. Dias
						sem horários ficam marcados como fechados.
					</CardDescription>
				</CardHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<CardContent className='space-y-6'>
							{/* Lista de Dias */}
							<div className='grid gap-4'>
								{DAYS_CONFIG.map((day) => {
									const hasTimesConfigured = hasTimes(day.key)
									const times = getDayTimes(day.key)
									return (
										<div
											key={day.key}
											className='flex items-center justify-between p-4 border rounded-lg'
										>
											<div className='flex items-center space-x-3'>
												<Checkbox
													id={day.key}
													checked={hasTimesConfigured || false}
													disabled={true} // Checkbox apenas para visualização
													className={
														hasTimesConfigured
															? 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white'
															: ''
													}
												/>
												<div className='grid gap-1.5 leading-none'>
													<label
														htmlFor={day.key}
														className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
													>
														{day.label}
													</label>
												</div>
											</div>

											<div className='flex items-center gap-2'>
												{/* Botão de Limpeza (apenas quando há horários) */}
												{hasTimesConfigured && (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																type='button'
																variant='outline'
																size='sm'
																className='text-red-600 hover:text-red-700 hover:bg-red-50'
															>
																<Trash2 className='h-4 w-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem
																onClick={() => clearDayTimes(day.key)}
																className='cursor-pointer text-red-600 focus:text-red-600'
															>
																<Trash2 className='h-4 w-4 mr-2' />
																Fechar este dia
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => clearAllTimes()}
																className='cursor-pointer text-red-700 focus:text-red-700 font-medium'
															>
																<Trash2 className='h-4 w-4 mr-2' />
																Fechar todos os dias
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												)}

												{/* Dropdown de Cópia */}
												{hasTimesConfigured && (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button type='button' variant='outline' size='sm'>
																<Copy className='h-4 w-4 mr-1' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align='end'>
															<DropdownMenuItem
																onClick={() => copyTimesToAllDays(day.key)}
																className='cursor-pointer'
															>
																<CopyCheck className='h-4 w-4 mr-2' />
																Copiar para todos os dias
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															{DAYS_CONFIG.filter((d) => d.key !== day.key).map(
																(otherDay) => (
																	<DropdownMenuItem
																		key={otherDay.key}
																		onClick={() =>
																			copyTimesToDay(day.key, otherDay.key)
																		}
																		className='cursor-pointer'
																	>
																		{otherDay.label}
																	</DropdownMenuItem>
																),
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												)}

												{/* Modal de Edição */}
												<Dialog
													open={isModalOpen && editingDay === day.key}
													onOpenChange={(open) => {
														setIsModalOpen(open)
														if (!open) {
															setEditingDay(null)
															setSelectedTimes([])
														}
													}}
												>
													<DialogTrigger asChild>
														<Button
															type='button'
															variant='outline'
															size='sm'
															onClick={() => {
																setEditingDay(day.key)
																setSelectedTimes([...times]) // Inicializar com horários atuais
																setIsModalOpen(true)
															}}
														>
															<Edit className='h-4 w-4 mr-1' />
															Editar
														</Button>
													</DialogTrigger>
													<DialogContent className='sm:max-w-md'>
														<DialogHeader>
															<DialogTitle>Horários - {day.label}</DialogTitle>
															<DialogDescription>
																Configure os horários de funcionamento para este
																dia.
															</DialogDescription>
														</DialogHeader>

														<div className='space-y-4'>
															{/* Selecionar Horários */}
															<div>
																<Horario
																	inline={true}
																	initialSelected={times}
																	onSelectionChange={(selectedHours) => {
																		setSelectedTimes(selectedHours)
																	}}
																/>
															</div>

															{/* Botão Atualizar Horários */}
															<div className='flex justify-end mt-4'>
																<Button
																	type='button'
																	onClick={() =>
																		updateDayTimes(day.key, selectedTimes)
																	}
																	disabled={selectedTimes.length === 0}
																	variant='system'
																>
																	Atualizar Horários
																</Button>
															</div>
														</div>
													</DialogContent>
												</Dialog>

												{!hasTimesConfigured && (
													<Badge variant='destructive' className='text-xs'>
														Fechado
													</Badge>
												)}
											</div>
										</div>
									)
								})}
							</div>
						</CardContent>
					</form>
				</Form>
			</Card>
		</div>
	)
}
