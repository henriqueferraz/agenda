/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Cliente da página de Funcionários: layout com SidebarInset, breadcrumb (Dashboard > Serviços > Funcionários)
 * e conteúdo central com ModelEmployee. Recebe lista inicial de funcionários e userId do server.
 *
 * @example
 * ```tsx
 * <EmployeePageClient employees={employees} userId={userId} />
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
import { ModelEmployee } from './model-employee'
import { EmployeeModel } from '@/lib/generated/prisma/models'
type EmployeeWithService = EmployeeModel
/** Props do componente EmployeePageClient. */
interface EmployeePageClientProps {
	/** Lista inicial de funcionários carregada no server e repassada ao ModelEmployee. */
	employees: EmployeeWithService[]
	/** ID do usuário (empresa) repassado ao ModelEmployee. */
	userId: string
}
/**
 * Página cliente de Funcionários: breadcrumb e ModelEmployee.
 * @param props - employees (lista inicial), userId
 * @returns JSX.Element
 */
export const EmployeePageClient = ({
	employees: initialEmployees,
	userId,
}: EmployeePageClientProps) => {
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
								<BreadcrumbLink href='/dashboard/services/employee'>
									Serviços
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Funcionários</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
				<div className='w-full max-w-6xl'>
					{/* Componente completo de funcionários com tabela e modal */}
					<ModelEmployee employees={initialEmployees} userId={userId} />
				</div>
			</div>
		</SidebarInset>
	)
}
