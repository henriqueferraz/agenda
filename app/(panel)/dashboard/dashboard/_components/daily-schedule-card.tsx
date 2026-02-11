/**
 * Card de agenda do dia no dashboard: link para /dashboard/schedule/calendar, lista de
 * agendamentos de hoje (getDayAppointments) ordenados por horário, com cliente, serviço,
 * funcionário, preço e contato. Data formatada em fuso São Paulo.
 *
 * @example
 * ```tsx
 * <DailyScheduleCard userId={userId} />
 * ```
 */
'use client'
/**
 *  Card de Agenda Diária para Dashboard
 *
 * Componente que exibe uma versão compacta da agenda diária no dashboard,
 * mostrando os agendamentos do dia atual. Baseado no componente DailySchedule
 * da página de Agendamento, mas adaptado para o formato de card.
 *
 * ## Funcionalidades
 * -  Lista de agendamentos do dia atual
 * -  Informações detalhadas: Cliente, serviço, funcionário, horário, preço
 * -  Indicadores visuais: Badges e cards organizados
 * -  Responsividade: Layout adaptável
 * -  Carregamento automático dos agendamentos do dia
 *
 * ## Estrutura da Interface
 * ```
 * ┌─ Agenda Diária ─────────────────────────────┐
 * │                                              │
 * │ ┌─ Agendamento 1 ─────────────────────────┐ │
 * │ │ 08:00 - João Silva                      │ │
 * │ │ Serviço: Corte | Funcionário: Maria    │ │
 * │ │ R$ 50,00                                │ │
 * │ └─────────────────────────────────────────┘ │
 * │                                              │
 * │ ┌─ Agendamento 2 ─────────────────────────┐ │
 * │ │ 09:00 - Pedro Santos                    │ │
 * │ │ Serviço: Barba | Funcionário: João     │ │
 * │ │ R$ 30,00                                │ │
 * │ └─────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────┘
 * ```
 *
 * ## Dependências Externas
 * - `getDayAppointments`: Busca agendamentos do dia
 * - Componentes UI: Card, Badge
 *
 * ## Estados do Componente
 * - **appointments**: Lista de agendamentos do dia
 * - **isLoading**: Estado de carregamento
 *
 * @param userId - ID do usuário (empresa)
 * @returns JSX.Element - Card de agenda diária renderizado
 *
 * @example
 * ```tsx
 * <DailyScheduleCard userId="usr_123" />
 * ```
 */
import { useMemo, useState, useEffect } from 'react'
import { Clock, User, Briefcase, PiggyBank, Mail, Phone } from 'lucide-react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getDayAppointments } from '../../schedule/calendar/_data-access/get-day-appointments'
import { getNowInSaoPaulo, formatDateInSaoPaulo } from '@/utils/date-timezone'
import { formatPhone } from '@/utils/formatPhone'
import Link from 'next/link'
/** Serviço associado ao agendamento no card. */
interface Service {
	id: string
	name: string
	price: number
	duration: number
	status: boolean
}
/** Agendamento exibido no card de agenda diária. */
interface Appointment {
	id: string
	name: string
	email: string
	phone: string
	time: string
	service: Service
	employee: { id: string; name: string }
}
/** Props do componente DailyScheduleCard. */
interface DailyScheduleCardProps {
	/** ID do usuário (empresa) para buscar agendamentos do dia. */
	userId: string
}
export const DailyScheduleCard = ({ userId }: DailyScheduleCardProps) => {
	const [appointments, setAppointments] = useState<Appointment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	// Carrega agendamentos do dia atual
	useEffect(() => {
		const loadTodayAppointments = async () => {
			setIsLoading(true)
			try {
				const today = getNowInSaoPaulo()
				const apts = await getDayAppointments({ userId, date: today })
				setAppointments(apts)
			} catch (error) {
				console.error('Erro ao carregar agendamentos do dia:', error)
				setAppointments([])
			} finally {
				setIsLoading(false)
			}
		}
		loadTodayAppointments()
	}, [userId])
	// Formata a data de hoje
	const formattedDate = useMemo(() => {
		const today = getNowInSaoPaulo()
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}
		return formatDateInSaoPaulo(today, options)
	}, [])
	// Ordena agendamentos por horário
	const sortedAppointments = useMemo(() => {
		return [...appointments].sort((a, b) => {
			const [aHours, aMinutes] = a.time.split(':').map(Number)
			const [bHours, bMinutes] = b.time.split(':').map(Number)
			if (aHours !== bHours) return aHours - bHours
			return aMinutes - bMinutes
		})
	}, [appointments])
	return (
		<Link href='/dashboard/schedule/calendar'>
			<Card className='cursor-pointer hover:shadow-md transition-shadow'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='text-lg flex items-center gap-2'>
								<Clock className='h-5 w-5' />
								Agenda Diária
							</CardTitle>
							<CardDescription>{formattedDate}</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className='space-y-3 max-h-[500px] overflow-y-auto'>
					{isLoading ? (
						<div className='flex items-center justify-center py-8'>
							<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
							<span className='ml-2 text-sm text-muted-foreground'>
								Carregando agendamentos...
							</span>
						</div>
					) : sortedAppointments.length === 0 ? (
						<div className='text-center py-8'>
							<p className='text-sm text-muted-foreground'>
								Nenhum agendamento para hoje.
							</p>
						</div>
					) : (
						<>
							<div className='mb-3'>
								<p className='text-sm font-semibold'>
									{sortedAppointments.length} agendamento
									{sortedAppointments.length !== 1 ? 's' : ''} hoje
								</p>
							</div>
							<div className='space-y-3'>
								{sortedAppointments.map((appointment) => (
									<div
										key={appointment.id}
										className='p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
									>
										<div className='flex items-start justify-between mb-2'>
											<div className='flex-1'>
												<div className='flex items-center gap-2 mb-2'>
													<Badge
														variant='outline'
														className='bg-white dark:bg-gray-800'
													>
														{appointment.time}
													</Badge>
												</div>
												<h4 className='font-semibold text-sm mb-1'>
													{appointment.name}
												</h4>
												<div className='grid grid-cols-4 gap-2 text-xs text-muted-foreground'>
													<div className='flex items-center gap-1'>
														<User className='h-3 w-3' />
														<span className='truncate'>
															{appointment.employee.name}
														</span>
													</div>
													<div className='flex items-center gap-1'>
														<Briefcase className='h-3 w-3' />
														<span className='truncate'>
															{appointment.service.name}
														</span>
													</div>
													<div className='flex items-center gap-1'>
														<PiggyBank className='h-3 w-3' />
														<span className='truncate'>
															{formatCurrency(appointment.service.price)}
														</span>
													</div>
													<div className='flex items-center gap-1'>
														<Clock className='h-3 w-3' />
														<span className='truncate'>
															{appointment.service.duration} min
														</span>
													</div>
												</div>
											</div>
										</div>
										<div className='mt-2 pt-2 border-t border-blue-300 dark:border-blue-700'>
											<div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
												<div className='flex items-center gap-1'>
													<Mail className='h-3 w-3' />
													<span className='truncate'>{appointment.email}</span>
												</div>
												<div className='flex items-center gap-1'>
													<Phone className='h-3 w-3' />
													<span className='truncate'>
														{formatPhone(appointment.phone)}
													</span>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</Link>
	)
}
