/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Layout cliente da página de Mensagens: SidebarInset + breadcrumb
 * (Dashboard > Serviços > Mensagens) e seções de configuração de lembretes (F-03)
 * e placeholder para envio de mensagens (F-07).
 *
 * @example
 * ```tsx
 * <MessagePageClient config={config} userId={userId} />
 * ```
 */
'use client'
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
import { MessageCircle, Send, Users } from 'lucide-react'
import type { MessageConfigData } from '../_data-access/get-message-config'

/** Props do componente MessagePageClient. */
interface MessagePageClientProps {
	/** Configuração atual de mensagens do usuário. */
	config: MessageConfigData
	/** ID do usuário (empresa). */
	userId: string
}

/**
 * Layout cliente da página de mensagens com breadcrumb e formulário de configuração.
 *
 * @param props - config (dados de configuração), userId
 * @returns React.ReactElement
 */
export const MessagePageClient = ({
	config,
	userId,
}: MessagePageClientProps): React.ReactElement => {
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

					<Card className='opacity-60'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
								<Send className='h-5 w-5' />
								Enviar Mensagens
							</CardTitle>
							<CardDescription>
								Em breve você poderá enviar mensagens personalizadas para seus clientes
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
								<Card className='cursor-not-allowed border-dashed'>
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

								<Card className='cursor-not-allowed border-dashed'>
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

								<Card className='cursor-not-allowed border-dashed'>
									<CardHeader className='p-4'>
										<CardTitle className='flex items-center gap-2 text-sm'>
											<MessageCircle className='h-4 w-4' />
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
		</SidebarInset>
	)
}
