/**
 * Página de configuração de horários (rota `/dashboard/configurations/time`).
 * Server Component que verifica autenticação, carrega horários via getInfoTimes
 * e renderiza breadcrumb e componente ModelTimes para configurar horários de funcionamento.
 */
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
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoTimes } from './_data-access/get-info-times'
import { ModelTimes } from './_components/model-times'
/**
 * Página de configuração de horários: verifica sessão, carrega horários e renderiza ModelTimes.
 * @returns Promise<JSX.Element>
 */
export const Times = async () => {
	// Verifica se usuário está autenticado
	const session = await getUserFromToken()
	if (!session) {
		redirect('/')
	}
	// Carrega informações de horários do usuário
	const user = await getInfoTimes({ userId: session?.id })
	// Se usuário não existe, redireciona para login
	if (!user) {
		redirect('/')
	}
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
								<BreadcrumbLink href='/dashboard/configurations/time'>
									Configurações
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Horários</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			{/* Conteúdo principal - Componente de horários */}
			<ModelTimes user={user} />
		</SidebarInset>
	)
}

export default Times
