/**
 * Pagina - /dashboard/configurations/activity
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/configurations/activity`, organizado no App Router.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/activity/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
import { getInfoActivity } from './_data-access/get-info-activity'
import { ModelActivity } from './_components/model_activity'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const Activity = async () => {
	// Verifica se usuário está autenticado
	const session = await getUserFromToken()
	if (!session) {
		redirect('/')
	}
	// Carrega informações atuais do usuário (incluindo atividade selecionada)
	const user = await getInfoActivity({ userId: session?.id })
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
								<BreadcrumbLink href='/dashboard/configurations/activity'>
									Configurações
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Atividade</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle className='text-center text-2xl font-bold'>
							Qual a atividade da sua empresa?
						</CardTitle>
						<CardDescription className='text-center text-sm'>
							Selecione a categoria que melhor representa a sua empresa. Esta
							informação será usada para personalizar sua experiência.
						</CardDescription>
					</CardHeader>

					{/* Formulário de seleção de atividade */}
					<ModelActivity user={user} />
				</Card>
			</div>
		</SidebarInset>
	)
}

export default Activity
