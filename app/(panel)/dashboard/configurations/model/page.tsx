/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Página de configuração do modelo da empresa (rota `/dashboard/configurations/model`).
 * Server Component que verifica autenticação, carrega dados do usuário via getInfoUser
 * e renderiza card com abas Pessoa Física e Pessoa Jurídica (ModelFisica e ModelJuridica).
 */
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInfoUser } from './_data-access/get-info-user'
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ModelFisica } from './_components/model-fisica'
import { ModelJuridica } from './_components/model-juridica'
export const Model = async () => {
	const session = await getUserFromToken()
	if (!session) {
		redirect('/')
	}
	const user = await getInfoUser({ userId: session?.id })
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
								<BreadcrumbLink href='/dashboard/configurations/model'>
									Configurações
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Modelo</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle className='text-center text-2xl font-bold'>
							Qual o seu modelo de sua empresa?
						</CardTitle>
						<CardDescription className='text-center text-xs'>
							Selecione o modelo que representa a sua empresa.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue='fisica'>
							<TabsList>
								<TabsTrigger value='fisica'>Física</TabsTrigger>
								<TabsTrigger value='juridica'>Jurídica</TabsTrigger>
							</TabsList>
							<TabsContent value='fisica'>
								<Card className='w-full max-w-2xl'>
									<CardHeader>
										<CardTitle>Pessoa Física</CardTitle>
										<CardDescription className='text-xs'>
											Se você é um profissional autônomo, informe aqui os seus
											dados.
										</CardDescription>
									</CardHeader>
									<ModelFisica user={user} />
								</Card>
							</TabsContent>
							<TabsContent value='juridica'>
								<Card className='w-full max-w-2xl'>
									<CardHeader>
										<CardTitle>Pessoa Jurídica</CardTitle>
										<CardDescription className='text-xs'>
											Se você é uma empresa, informe aqui os seus dados.
										</CardDescription>
									</CardHeader>
									<ModelJuridica user={user} />
								</Card>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</SidebarInset>
	)
}

export default Model
