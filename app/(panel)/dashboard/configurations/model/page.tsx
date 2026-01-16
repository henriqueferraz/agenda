/**
 * Pagina - /dashboard/configurations/model
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/configurations/model`, organizado no App Router.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Orquestrar a composicao visual da rota.
 * - Disparar carregamentos de dados quando necessario.
 * - Renderizar estados de sucesso e erro.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/configurations/model/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
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
import { ModelFisica } from './_components/model_fisica'
import { ModelJuridica } from './_components/model_juridica'
export const Model = async () => {
	const session = await getUserFromToken()
	/*
	 * Fluxo interno do modulo:
	 * 1. Inicializa dependencias e configuracoes locais.
	 * 2. Define tipos, constantes e validacoes necessarias.
	 * 3. Executa a logica principal (acoes, consultas ou UI).
	 * 4. Trata retornos, estados e exibicao final.
	 */
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
