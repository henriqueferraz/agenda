/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * Layout cliente da página de Mensagens: SidebarInset + breadcrumb
 * (Dashboard > Serviços > Mensagens), configuração de lembretes (F-03)
 * e envio de mensagens WhatsApp (F-07) com 3 modos: individual, massa e indisponibilidade.
 *
 * @example
 * ```tsx
 * <MessagePageClient config={config} userId={userId} futureAppointments={appointments} />
 * ```
 */
'use client'
import React, { useState } from 'react'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageConfigForm } from './message-config-form'
import { IndividualMessageDialog } from './individual-message-dialog'
import { BulkMessageDialog } from './bulk-message-dialog'
import { UnavailabilityDialog } from './unavailability-dialog'
import { AlertTriangle, MessageCircle, Send, Users } from 'lucide-react'
import type { MessageConfigData } from '../_data-access/get-message-config'
import type { PeriodAppointment } from '../_data-access/get-appointments-by-period'

/** Props do componente MessagePageClient. */
interface MessagePageClientProps {
	/** Configuração atual de mensagens do usuário. */
	config: MessageConfigData
	/** ID do usuário (empresa). */
	userId: string
	/** Lista de agendamentos futuros para o dialog individual. */
	futureAppointments: PeriodAppointment[]
}

/**
 * Layout cliente da página de mensagens com breadcrumb, formulário de
 * configuração de lembretes e cards de envio WhatsApp (F-07).
 *
 * @param props - config, userId, futureAppointments
 * @returns React.ReactElement
 */
export const MessagePageClient = ({
	config,
	userId,
	futureAppointments,
}: MessagePageClientProps): React.ReactElement => {
	const [individualOpen, setIndividualOpen] = useState(false)
	const [bulkOpen, setBulkOpen] = useState(false)
	const [unavailabilityOpen, setUnavailabilityOpen] = useState(false)

	return (
		<SidebarInset>
			<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
				<div className='flex items-center gap-2 px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator
						orientation='vertical'
						className='mr-2 data-[orientation=vertical]:h-4'
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href='/dashboard/services/message'>
									Serviços
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Mensagens</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
				<div className='w-full max-w-4xl space-y-6'>
					<MessageConfigForm config={config} userId={userId} />

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
								<Send className='h-5 w-5' />
								Enviar Mensagens
							</CardTitle>
							<CardDescription>
								Envie mensagens personalizadas via WhatsApp para seus clientes
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
								<Card
									className='cursor-pointer border-solid transition-colors hover:border-primary hover:bg-muted/50'
									onClick={() => setIndividualOpen(true)}
									tabIndex={0}
									role='button'
									aria-label='Abrir envio de mensagem individual'
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											setIndividualOpen(true)
										}
									}}
								>
									<CardHeader className='p-4'>
										<CardTitle className='flex items-center gap-2 text-sm'>
											<MessageCircle className='h-4 w-4' />
											Mensagem Individual
										</CardTitle>
										<CardDescription className='text-xs'>
											Envie para um cliente específico
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									className='cursor-pointer border-solid transition-colors hover:border-primary hover:bg-muted/50'
									onClick={() => setBulkOpen(true)}
									tabIndex={0}
									role='button'
									aria-label='Abrir envio de mensagem em massa'
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											setBulkOpen(true)
										}
									}}
								>
									<CardHeader className='p-4'>
										<CardTitle className='flex items-center gap-2 text-sm'>
											<Users className='h-4 w-4' />
											Mensagem em Massa
										</CardTitle>
										<CardDescription className='text-xs'>
											Envie para vários clientes de uma vez
										</CardDescription>
									</CardHeader>
								</Card>

								<Card
									className='cursor-pointer border-solid transition-colors hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
									onClick={() => setUnavailabilityOpen(true)}
									tabIndex={0}
									role='button'
									aria-label='Abrir aviso de indisponibilidade'
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											setUnavailabilityOpen(true)
										}
									}}
								>
									<CardHeader className='p-4'>
										<CardTitle className='flex items-center gap-2 text-sm'>
											<AlertTriangle className='h-4 w-4' />
											Aviso de Indisponibilidade
										</CardTitle>
										<CardDescription className='text-xs'>
											Notifique clientes sobre pausas ou feriados
										</CardDescription>
									</CardHeader>
								</Card>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			<IndividualMessageDialog
				open={individualOpen}
				onOpenChange={setIndividualOpen}
				appointments={futureAppointments}
			/>
			<BulkMessageDialog
				open={bulkOpen}
				onOpenChange={setBulkOpen}
				userId={userId}
			/>
			<UnavailabilityDialog
				open={unavailabilityOpen}
				onOpenChange={setUnavailabilityOpen}
				userId={userId}
			/>
		</SidebarInset>
	)
}
