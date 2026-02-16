/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Página de configuração de endereço (rota `/dashboard/configurations/address`).
 * Server Component que verifica autenticação, carrega endereço via getInfoAddress
 * e renderiza breadcrumb e formulário ModelAddress para edição do endereço.
 */
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoAddress } from './_data-access/get-info-address'
import { ModelAddress } from './_components/model-address'
/**
 * Página de configuração de endereço: verifica sessão, carrega dados e renderiza ModelAddress.
 * @returns Promise<JSX.Element>
 */
export const Address = async () => {
	const session = await getUserFromToken()
	if (!session) {
		redirect('/')
	}
	const user = await getInfoAddress({ userId: session?.id })
	if (!user) {
		redirect('/')
	}
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
								<BreadcrumbLink href='/dashboard/configurations/address'>
									Configurações
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Endereço</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			<ModelAddress user={user} />
		</SidebarInset>
	)
}

export default Address
