/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-03-11
 * @version 2026.03.11
 * @projectVersion 0.9.0
 */
/**
 * Página de início do dashboard (rota `/dashboard` — conteúdo principal).
 * Renderiza breadcrumb, título, cards de estatísticas (agendamentos hoje, link de
 * agendamento público, alerta de novo agendamento), card de agenda do dia e lista de tarefas.
 */
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Calendar } from 'lucide-react'
import { NewAppointmentAlert } from './_components/new-appointment-alert'
import { DailyScheduleCard } from './_components/daily-schedule-card'
import { TasksList } from './_components/tasks-list'
import { PublicBookingUrlCard } from './_components/public-booking-url-card'
import { ConfigWarningBanner } from './_components/config-warning-banner'
interface DashboardStats {
	appointmentsToday: number
	appointmentsYesterday: number
	uniqueClients: number
	uniqueClientsThisMonth: number
	availableSlotsToday: number
	monthlyRevenue: number
	monthlyRevenueLastMonth: number
}
interface DashboardPageProps {
	stats: DashboardStats
	userId: string
}
/**
 * Renderiza a view de início do dashboard com estatísticas, cards e lista de tarefas.
 * @param props - stats (métricas do dashboard) e userId
 * @returns JSX.Element
 */
export const DashboardPage = async ({ stats, userId }: DashboardPageProps) => {
	// Calcula diferenças para exibição
	const appointmentsDiff = stats.appointmentsToday - stats.appointmentsYesterday
	return (
		<SidebarInset>
			{/* Cabeçalho com navegação breadcrumb */}
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
								<BreadcrumbLink href='/dashboard'>Principal</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Início</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className='flex flex-1 flex-col gap-6 p-4 sm:p-6'>
				{/* Título da página */}
				<div>
					<h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
						Dashboard
					</h1>
					<p className='text-muted-foreground text-sm sm:text-base'>
						Bem-vindo ao sistema de agendamento. Aqui você pode gerenciar seus
						serviços e agendamentos.
					</p>
				</div>

				{/* Banner de aviso de configurações pendentes */}
				<ConfigWarningBanner userId={userId} />

				{/* Cards de estatísticas */}
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
							<CardTitle className='text-sm font-medium'>
								Agendamentos Hoje
							</CardTitle>
							<Calendar className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>
								{stats.appointmentsToday}
							</div>
							<p className='text-xs text-muted-foreground'>
								{appointmentsDiff > 0 ? '+' : ''}
								{appointmentsDiff} desde ontem
							</p>
						</CardContent>
					</Card>

					{/* Card de Link de Agendamento Público */}
					<PublicBookingUrlCard userId={userId} />

					{/* Card de Notificação de Novo Agendamento */}
					<NewAppointmentAlert userId={userId} />
				</div>

				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-2'>
					{/* Card de Agendamentos do dia atual */}
					<DailyScheduleCard userId={userId} />
					{/* Card de Tarefas */}
					<TasksList userId={userId} />
				</div>
			</div>
		</SidebarInset>
	)
}

export default DashboardPage
