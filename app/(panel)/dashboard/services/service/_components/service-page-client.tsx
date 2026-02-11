/**
 * Cliente da página de Serviços: layout com SidebarInset, breadcrumb (Dashboard > Serviços > Serviços)
 * e conteúdo central com ModelService. Recebe lista inicial de serviços do server.
 *
 * // Uso conforme o fluxo da aplicacao.
 *
 * @example
 * ```tsx
 * <ServicePageClient services={await getInfoService({ userId })} />
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
import { ModelService } from './model-service'
import { ServiceModel } from '@/lib/generated/prisma/models'
type Service = ServiceModel
// Props do componente cliente
interface ServicePageClientProps {
	/** Lista inicial de serviços */
	services: Service[]
}
/**
 * Componente cliente da página de serviços
 *
 * Renderiza a interface da página com navegação e o componente ModelService
 * que gerencia internamente a tabela de serviços.
 */
export const ServicePageClient = ({
	services: initialServices,
}: ServicePageClientProps) => {
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
								<BreadcrumbLink href='/dashboard/services/service'>
									Serviços
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Serviços</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
				<div className='w-full max-w-6xl'>
					{/* Componente completo de serviços com tabela */}
					<ModelService services={initialServices} />
				</div>
			</div>
		</SidebarInset>
	)
}
