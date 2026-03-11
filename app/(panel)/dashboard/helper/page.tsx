/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-11
 * @modified 2026-03-11
 * @version 2026.03.11
 * @projectVersion 0.9.0
 */
/**
 * Página de ajuda com guia passo a passo das configurações e serviços (rota `/dashboard/helper`).
 * Server Component que verifica autenticação e renderiza um guia completo para novos usuários
 * com instruções detalhadas sobre como configurar o sistema e gerenciar serviços.
 *
 * @example
 * // Acesso via sidebar: Ajuda
 * // Exibe guia completo de configuração inicial
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
import { Button } from '@/components/ui/button'
import {
	Activity,
	Building2,
	MapPin,
	Clock,
	SquareTerminal,
	Users,
	MessageCircle,
	ArrowRight,
	CheckCircle2,
	Check,
} from 'lucide-react'
import Link from 'next/link'
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getConfigStatus } from './_data-access/get-config-status'

/**
 * Página de ajuda: guia passo a passo para configuração inicial.
 * Verifica autenticação e renderiza instruções detalhadas.
 *
 * @returns Promise<JSX.Element>
 */
export const HelperPage = async () => {
	// Verifica se usuário está autenticado
	const session = await getUserFromToken()
	if (!session) {
		redirect('/')
	}

	// Busca o status de configuração de cada item
	const configStatus = await getConfigStatus({ userId: session.id })

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
								<BreadcrumbPage>Ajuda</BreadcrumbPage>
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
						Guia de Configuração
					</h1>
					<p className='text-muted-foreground mt-2'>
						Bem-vindo! Siga este passo a passo para configurar seu sistema de
						agendamento.
					</p>
				</div>

				{/* Seção de Configurações */}
				<Card>
					<CardHeader>
						<CardTitle className='text-xl sm:text-2xl font-bold'>
							📋 Configurações Iniciais
						</CardTitle>
						<CardDescription>
							Configure os dados básicos da sua empresa seguindo a ordem abaixo.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Passo 1: Atividade */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										1
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<Activity className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Atividade da Empresa
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Selecione a categoria que melhor representa sua empresa. Esta
										informação será usada para personalizar sua experiência.
									</p>
									<Button
										asChild
										variant={
											configStatus.activityConfigured ? 'default' : 'outline'
										}
										className={`w-full sm:w-auto ${
											configStatus.activityConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/configurations/activity'>
											{configStatus.activityConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Atividade Configurada
												</>
											) : (
												<>
													Configurar Atividade
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Passo 2: Modelo */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										2
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<Building2 className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Modelo da Empresa
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Configure se sua empresa é Pessoa Física (PF) ou Pessoa
										Jurídica (PJ). Faça o upload do logo e preencha os dados
										correspondentes.
									</p>
									<Button
										asChild
										variant={configStatus.modelConfigured ? 'default' : 'outline'}
										className={`w-full sm:w-auto ${
											configStatus.modelConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/configurations/model'>
											{configStatus.modelConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Modelo Configurado
												</>
											) : (
												<>
													Configurar Modelo
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Passo 3: Endereço */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										3
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<MapPin className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Endereço
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Informe o endereço completo da sua empresa. Você pode buscar
										pelo CEP para preencher automaticamente os campos.
									</p>
									<Button
										asChild
										variant={
											configStatus.addressConfigured ? 'default' : 'outline'
										}
										className={`w-full sm:w-auto ${
											configStatus.addressConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/configurations/address'>
											{configStatus.addressConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Endereço Configurado
												</>
											) : (
												<>
													Configurar Endereço
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Passo 4: Horários */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										4
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<Clock className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Horários de Funcionamento
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Configure os dias da semana e horários em que sua empresa
										atende. Defina horários de início e fim para cada dia.
									</p>
									<Button
										asChild
										variant={configStatus.timesConfigured ? 'default' : 'outline'}
										className={`w-full sm:w-auto ${
											configStatus.timesConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/configurations/time'>
											{configStatus.timesConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Horários Configurados
												</>
											) : (
												<>
													Configurar Horários
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Seção de Serviços */}
				<Card>
					<CardHeader>
						<CardTitle className='text-xl sm:text-2xl font-bold'>
							⚙️ Configuração de Serviços
						</CardTitle>
						<CardDescription>
							Após configurar os dados básicos, configure seus serviços e
							funcionários.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Passo 1: Serviços */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										1
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<SquareTerminal className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Serviços
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Crie os serviços que sua empresa oferece. Defina nome,
										descrição, duração, preço e outros detalhes importantes.
									</p>
									<Button
										asChild
										variant={
											configStatus.servicesConfigured ? 'default' : 'outline'
										}
										className={`w-full sm:w-auto ${
											configStatus.servicesConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/services/service'>
											{configStatus.servicesConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Serviços Configurados
												</>
											) : (
												<>
													Gerenciar Serviços
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Passo 2: Funcionários */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										2
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<Users className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Funcionários
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Cadastre seus funcionários e defina quais serviços cada um
										pode realizar. Configure também os horários de trabalho de
										cada funcionário.
									</p>
									<Button
										asChild
										variant={
											configStatus.employeesConfigured ? 'default' : 'outline'
										}
										className={`w-full sm:w-auto ${
											configStatus.employeesConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/services/employee'>
											{configStatus.employeesConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Funcionários Configurados
												</>
											) : (
												<>
													Gerenciar Funcionários
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>

						{/* Passo 3: Mensagens */}
						<div className='flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card'>
							<div className='flex items-start gap-3 flex-1'>
								<div className='shrink-0 mt-1'>
									<div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm'>
										3
									</div>
								</div>
								<div className='flex-1 space-y-2'>
									<div className='flex items-center gap-2'>
										<MessageCircle className='h-5 w-5 text-primary' />
										<h3 className='font-semibold text-base sm:text-lg'>
											Mensagens
										</h3>
									</div>
									<p className='text-sm text-muted-foreground'>
										Configure os lembretes automáticos que serão enviados aos
										clientes. Você pode enviar mensagens individuais, em massa
										ou informar indisponibilidades.
									</p>
									<Button
										asChild
										variant={
											configStatus.messagesConfigured ? 'default' : 'outline'
										}
										className={`w-full sm:w-auto ${
											configStatus.messagesConfigured
												? 'bg-green-600 hover:bg-green-700'
												: ''
										}`}
									>
										<Link href='/dashboard/services/message'>
											{configStatus.messagesConfigured ? (
												<>
													<Check className='mr-2 h-4 w-4' />
													Mensagens Configuradas
												</>
											) : (
												<>
													Configurar Mensagens
													<ArrowRight className='ml-2 h-4 w-4' />
												</>
											)}
										</Link>
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Dica Final */}
				{(() => {
					const allConfigured =
						configStatus.activityConfigured &&
						configStatus.modelConfigured &&
						configStatus.addressConfigured &&
						configStatus.timesConfigured &&
						configStatus.servicesConfigured &&
						configStatus.employeesConfigured &&
						configStatus.messagesConfigured

					return (
						<Card
							className={
								allConfigured
									? 'border-green-600/50 bg-green-50 dark:bg-green-950/20'
									: 'border-primary/50 bg-primary/5'
							}
						>
							<CardContent className='pt-6'>
								<div className='flex items-start gap-3'>
									<CheckCircle2
										className={`h-5 w-5 mt-0.5 shrink-0 ${
											allConfigured ? 'text-green-600' : 'text-primary'
										}`}
									/>
									<div>
										<h3
											className={`font-semibold text-base sm:text-lg mb-2 ${
												allConfigured ? 'text-green-700 dark:text-green-400' : ''
											}`}
										>
											{allConfigured
												? 'Está tudo pronto para começar!'
												: 'Pronto para começar!'}
										</h3>
										<p
											className={`text-sm ${
												allConfigured
													? 'text-green-700 dark:text-green-300'
													: 'text-muted-foreground'
											}`}
										>
											{allConfigured
												? 'Parabéns! Todas as configurações foram concluídas. Compartilhe o link de agendamento público com seus clientes e comece a gerenciar sua agenda!'
												: 'Após concluir todas as configurações acima, você estará pronto para receber agendamentos. Compartilhe o link de agendamento público com seus clientes e comece a gerenciar sua agenda!'}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)
				})()}
			</div>
		</SidebarInset>
	)
}

export default HelperPage
