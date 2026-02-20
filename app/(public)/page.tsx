/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Página inicial pública (rota `/`).
 * Client Component: landing com hero, carrossel, seção "Como Funciona", notificações,
 * funcionalidades (9 cards), benefícios, CTA com trial 30 dias, formulário de contato
 * e header/footer; redireciona para dashboard ou login conforme useAuth.
 */
'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	LogIn,
	Calendar,
	Users,
	Clock,
	BarChart3,
	CheckCircle2,
	Shield,
	Zap,
	MessageCircle,
	Mail,
	CalendarClock,
	ShieldCheck,
	Link2,
	UserCog,
	Scissors,
	Sparkles,
	Settings,
	Share2,
	LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
// Imagens do carrossel — representam os tipos de negócio atendidos
const carouselImages = [
	{ src: '/barbeiro.png', alt: 'Barbearia' },
	{ src: '/cabelereiro.png', alt: 'Cabeleireiro' },
	{ src: '/manicure.png', alt: 'Manicure' },
	{ src: '/maquiagem.png', alt: 'Maquiagem' },
	{ src: '/imagem01.png', alt: 'Pet Shop' },
	{ src: '/imagem12.png', alt: 'Salão Premium' },
	{ src: '/imagem11.png', alt: 'Banho e Tosa' },
	{ src: '/imagem14.png', alt: 'Salão Profissional' },
]
// Funcionalidades principais — imagens distintas do carrossel para evitar duplicatas
const features = [
	{
		icon: Calendar,
		title: 'Agendamentos Inteligentes',
		description:
			'Calendário mensal interativo com agenda diária detalhada, verificação automática de disponibilidade e confirmação instantânea via WhatsApp e Email.',
		image: '/imagem15.png',
	},
	{
		icon: CalendarClock,
		title: 'Gestão de Agendamentos',
		description:
			'Edite, cancele ou reagende agendamentos com facilidade. Histórico completo de alterações, motivo de cancelamento e visual diferenciado por status.',
		image: '/imagem10.png',
	},
	{
		icon: ShieldCheck,
		title: 'Validação de Conflitos',
		description:
			'Prevenção automática de conflitos de horário. Impede sobreposição por profissional e por cliente, considerando a duração de cada serviço.',
		image: '/petshop.png',
	},
	{
		icon: Link2,
		title: 'Link de Agendamento',
		description:
			'Compartilhe um link exclusivo para seus clientes agendarem online, sem precisar de login. Ideal para redes sociais, WhatsApp e cartão de visitas.',
		image: '/imagem13.png',
	},
	{
		icon: UserCog,
		title: 'Autogestão pelo Cliente',
		description:
			'Seu cliente cancela ou reagenda diretamente pelo link recebido, sem precisar ligar ou enviar mensagem. Menos trabalho manual para você.',
		image: '/imagem02.png',
	},
	{
		icon: Scissors,
		title: 'Gestão de Serviços',
		description:
			'Cadastre serviços com preço, duração e vínculo a profissionais específicos. Controle completo do seu catálogo de atendimentos.',
		image: '/imagem03.png',
	},
	{
		icon: Users,
		title: 'Gestão de Funcionários',
		description:
			'Cadastro completo de funcionários com vínculo a múltiplos serviços e configuração de horários de trabalho individuais por dia da semana.',
		image: '/imagem11.png',
	},
	{
		icon: BarChart3,
		title: 'Dashboard Analítico',
		description:
			'Estatísticas em tempo real com métricas de negócio, alertas de novos agendamentos, agenda diária e lista de tarefas integrada.',
		image: '/imagem12.png',
	},
	{
		icon: Clock,
		title: 'Horários e Feriados',
		description:
			'Configure horários de funcionamento por dia da semana, horários específicos por funcionário e gerencie feriados e dias de folga.',
		image: '/imagem14.png',
	},
]
// Benefícios
const benefits = [
	{
		icon: Shield,
		title: 'Seguro e Confiável',
		description:
			'Autenticação robusta com verificação por e-mail, proteção contra ataques e dados sempre seguros.',
	},
	{
		icon: Zap,
		title: 'Rápido e Eficiente',
		description:
			'Interface otimizada, carregamento rápido e experiência fluida para você e seus clientes.',
	},
	{
		icon: Share2,
		title: 'Agendamento sem Login',
		description:
			'Seus clientes agendam pelo link, sem criar conta. Compartilhe nas redes sociais e WhatsApp.',
	},
	{
		icon: CheckCircle2,
		title: 'Fácil de Usar',
		description:
			'Interface intuitiva e moderna, sem necessidade de treinamento. Configure e comece a usar em minutos.',
	},
]
/**
 * Página inicial (landing) com seções hero, como funciona, notificações,
 * funcionalidades (9 cards), benefícios, CTA com trial 30 dias e contato.
 * @returns JSX.Element
 */
export const Home = () => {
	const { user, loading } = useAuth()
	const [currentImageIndex, setCurrentImageIndex] = useState(0)
	const [contactName, setContactName] = useState('')
	const [contactEmail, setContactEmail] = useState('')
	const [contactMessage, setContactMessage] = useState('')
	const [isSendingContact, setIsSendingContact] = useState(false)
	// Auto-rotaciona o carrossel
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
		}, 4000) // Muda a cada 4 segundos
		return () => clearInterval(interval)
	}, [])
	const handleContactSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault()
		if (!contactName || !contactEmail || !contactMessage) {
			toast.error('Preencha todos os campos do formulário.')
			return
		}
		setIsSendingContact(true)
		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: contactName,
					email: contactEmail,
					message: contactMessage,
				}),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Erro ao enviar mensagem.')
				return
			}
			toast.success('Mensagem enviada com sucesso.')
			setContactName('')
			setContactEmail('')
			setContactMessage('')
		} catch (error) {
			console.error('Erro ao enviar contato:', error)
			toast.error('Erro inesperado ao enviar mensagem.')
		} finally {
			setIsSendingContact(false)
		}
	}
	return (
		<div className='min-h-screen max-w-[1920px] mx-auto bg-linear-to-b from-gray-50 to-white'>
			{/* Header */}
			<header className='sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm'>
				<div className='container mx-auto flex h-16 items-center justify-between px-4'>
					<div className='flex min-w-0 items-center gap-2'>
						<Calendar className='h-6 w-6 shrink-0 text-primary' />
						<span className='truncate text-base font-bold sm:text-xl'>
							Sistema de Agendamento Online
						</span>
					</div>
					{loading ? (
						<div className='h-10 w-24 animate-pulse rounded bg-gray-200' />
					) : user ? (
						<Link href='/dashboard'>
							<Button className='min-h-[44px]'>Acessar Dashboard</Button>
						</Link>
					) : (
						<Link href='/login'>
							<Button className='min-h-[44px]'>
								<LogIn className='mr-2 h-4 w-4' />
								Entrar
							</Button>
						</Link>
					)}
				</div>
			</header>

			{/* Hero Section com Carrossel */}
			<section className='relative overflow-hidden bg-linear-to-r from-primary/10 via-primary/5 to-transparent py-12 sm:py-20'>
				<div className='container mx-auto px-4'>
					<div className='grid gap-8 sm:gap-12 lg:grid-cols-2 lg:items-center'>
						{/* Texto Hero */}
						<div className='space-y-6'>
							<div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary'>
								<Sparkles className='h-4 w-4' />
								Teste grátis por 30 dias — todas as funcionalidades!
							</div>
							<h1 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl'>
								Sistema de Agendamento
								<span className='text-primary'> Online</span>
							</h1>
							<p className='text-lg text-gray-600 sm:text-xl'>
								Gerencie agendamentos com validação de conflitos, cancelamento,
								reagendamento e link público para seus clientes agendarem sem
								login. Perfeito para barbearias, salões, pet shops e muito mais.
							</p>
							<div className='flex flex-wrap gap-4'>
								{!user && (
									<Link href='/register'>
										<Button size='lg' className='min-h-[44px]'>
											<Sparkles className='mr-2 h-5 w-5' />
											Testar Grátis por 30 Dias
										</Button>
									</Link>
								)}
								{user && (
									<Link href='/dashboard'>
										<Button size='lg' className='min-h-[44px]'>
											<LayoutDashboard className='mr-2 h-5 w-5' />
											Acessar Dashboard
										</Button>
									</Link>
								)}
							</div>
						</div>

						{/* Carrossel de Imagens */}
						<div className='relative h-64 w-full overflow-hidden rounded-lg shadow-2xl sm:h-80 md:h-96'>
							{carouselImages.map((image, index) => (
								<div
									key={index}
									className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
								>
									<Image
										src={image.src}
										alt={image.alt}
										fill
										className='object-cover'
										priority={index === 0}
									/>
									<div className='absolute inset-0 bg-linear-to-t from-black/50 to-transparent' />
									<div className='absolute bottom-4 left-4 text-white'>
										<h3 className='text-lg sm:text-2xl font-bold'>{image.alt}</h3>
									</div>
								</div>
							))}

							{/* Indicadores do carrossel */}
							<div className='absolute bottom-4 right-4 flex gap-2' role='tablist'>
								{carouselImages.map((_, index) => (
									<button
										key={index}
										role='tab'
										tabIndex={0}
										aria-label={`Ir para imagem ${index + 1}`}
										aria-selected={index === currentImageIndex}
										onClick={() => setCurrentImageIndex(index)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault()
												setCurrentImageIndex(index)
											}
										}}
										className={`h-2 w-8 rounded-full transition-all ${index === currentImageIndex
											? 'bg-white'
											: 'bg-white/50 hover:bg-white/75'
											}`}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Como Funciona — 3 passos */}
			<section className='bg-white py-10 sm:py-16 md:py-20'>
				<div className='container mx-auto px-4'>
					<div className='mb-8 sm:mb-12 text-center'>
						<h2 className='text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
							Como Funciona
						</h2>
						<p className='mt-4 text-lg text-gray-600 sm:text-xl'>
							Comece a usar em 3 passos simples
						</p>
					</div>

					<div className='mx-auto grid max-w-5xl gap-8 md:grid-cols-3'>
						{[
							{
								step: '1',
								icon: Settings,
								title: 'Cadastre-se e Configure',
								description:
									'Crie sua conta gratuita e configure seus serviços, funcionários e horários de atendimento.',
							},
							{
								step: '2',
								icon: Share2,
								title: 'Compartilhe seu Link',
								description:
									'Envie o link de agendamento para seus clientes via WhatsApp, redes sociais ou cartão de visitas.',
							},
							{
								step: '3',
								icon: LayoutDashboard,
								title: 'Gerencie no Dashboard',
								description:
									'Acompanhe agendamentos, faturamento, lembretes e receba notificações automáticas em tempo real.',
							},
						].map((item) => {
							const StepIcon = item.icon
							return (
								<div key={item.step} className='relative text-center'>
									<div className='mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10'>
										<StepIcon className='h-8 w-8 text-primary' />
									</div>
									<div className='mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-white'>
										{item.step}
									</div>
									<h3 className='mb-2 text-lg font-semibold text-gray-900'>
										{item.title}
									</h3>
									<p className='text-gray-600'>{item.description}</p>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* Destaque - Notificações Automáticas */}
			<section className='bg-linear-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 py-10 sm:py-16'>
				<div className='container mx-auto px-4'>
					<div className='mx-auto max-w-4xl rounded-2xl border-2 border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 shadow-lg'>
						<div className='flex flex-col md:flex-row items-center gap-6'>
							<div className='shrink-0'>
								<div className='flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/30'>
									<MessageCircle className='h-10 w-10 text-green-600 dark:text-green-400' />
								</div>
							</div>
							<div className='flex-1 text-center md:text-left'>
								<h3 className='text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3'>
									Notificações Automáticas para seus Clientes
								</h3>
								<p className='text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-4'>
									Seus clientes são notificados automaticamente em cada etapa:
								</p>
								<div className='grid md:grid-cols-2 gap-4'>
									<div className='flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'>
										<div className='shrink-0'>
											<MessageCircle className='h-6 w-6 text-green-600 dark:text-green-400' />
										</div>
										<div>
											<h4 className='font-semibold text-gray-900 dark:text-white'>
												WhatsApp Instantâneo
											</h4>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												Confirmação, cancelamento e reagendamento
											</p>
										</div>
									</div>
									<div className='flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'>
										<div className='shrink-0'>
											<Mail className='h-6 w-6 text-blue-600 dark:text-blue-400' />
										</div>
										<div>
											<h4 className='font-semibold text-gray-900 dark:text-white'>
												Email Detalhado
											</h4>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												Todas as informações do agendamento
											</p>
										</div>
									</div>
								</div>
								<p className='mt-4 text-sm text-gray-600 dark:text-gray-400 italic'>
									Seus clientes sempre informados, sem trabalho manual!
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Funcionalidades Principais */}
			<section className='py-10 sm:py-16 md:py-20'>
				<div className='container mx-auto px-4'>
					<div className='mb-8 sm:mb-12 text-center'>
						<h2 className='text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
							Funcionalidades Principais
						</h2>
						<p className='mt-4 text-lg text-gray-600 sm:text-xl'>
							Tudo que você precisa para gerenciar seu negócio de forma
							profissional
						</p>
					</div>

					<div className='grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3'>
						{features.map((feature, index) => {
							const Icon = feature.icon
							return (
								<Card
									key={index}
									className='overflow-hidden transition-shadow hover:shadow-lg'
								>
									<div className='relative h-36 sm:h-48 w-full'>
										<Image
											src={feature.image}
											alt={feature.title}
											fill
											className='object-cover'
										/>
									</div>
									<CardHeader>
										<div className='mb-2 flex items-center gap-2'>
											<Icon className='h-6 w-6 text-primary' />
											<CardTitle>{feature.title}</CardTitle>
										</div>
										<CardDescription className='text-base'>
											{feature.description}
										</CardDescription>
									</CardHeader>
								</Card>
							)
						})}
					</div>
				</div>
			</section>

			{/* Benefícios */}
			<section className='bg-gray-50 py-10 sm:py-16 md:py-20'>
				<div className='container mx-auto px-4'>
					<div className='mb-8 sm:mb-12 text-center'>
						<h2 className='text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
							Por que escolher o Agenda?
						</h2>
						<p className='mt-4 text-lg text-gray-600 sm:text-xl'>
							Vantagens que fazem a diferença no seu dia a dia
						</p>
					</div>

					<div className='grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4'>
						{benefits.map((benefit, index) => {
							const Icon = benefit.icon
							return (
								<div key={index} className='text-center'>
									<div className='mb-4 flex justify-center'>
										<div className='rounded-full bg-primary/10 p-4'>
											<Icon className='h-8 w-8 text-primary' />
										</div>
									</div>
									<h3 className='mb-2 text-lg sm:text-xl font-semibold'>
										{benefit.title}
									</h3>
									<p className='text-gray-600'>{benefit.description}</p>
								</div>
							)
						})}
					</div>
				</div>
			</section>

			{/* Call to Action Final */}
			<section className='bg-linear-to-r from-primary to-primary/80 py-10 sm:py-16 md:py-20'>
				<div className='container mx-auto px-4 text-center'>
					<h2 className='mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl'>
						Pronto para transformar seu negócio?
					</h2>
					<p className='mb-8 text-lg text-white/90 sm:text-xl'>
						Comece a gerenciar seus agendamentos de forma profissional hoje
						mesmo
					</p>
					{!user && (
						<div>
							<Link href='/register'>
								<Button size='lg' variant='secondary' className='min-h-[44px] whitespace-normal text-center'>
									<Sparkles className='mr-2 h-5 w-5' />
									Começar Grátis — 30 Dias sem Compromisso
								</Button>
							</Link>
							<p className='mt-3 text-sm text-white/70'>
								Sem cartão de crédito. Cancele quando quiser.
							</p>
						</div>
					)}
					{user && (
						<Link href='/dashboard'>
							<Button size='lg' variant='secondary' className='min-h-[44px]'>
								<LayoutDashboard className='mr-2 h-5 w-5' />
								Acessar Dashboard
							</Button>
						</Link>
					)}
				</div>
			</section>

			{/* Contato */}
			<section className='py-10 sm:py-16 md:py-20'>
				<div className='container mx-auto px-4'>
					<div className='mb-8 sm:mb-12 text-center'>
						<h2 className='text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl'>
							Fale Conosco
						</h2>
						<p className='mt-4 text-lg text-gray-600 sm:text-xl'>
							Envie sua mensagem e retornaremos o mais breve possível.
						</p>
					</div>
					<div className='mx-auto max-w-2xl'>
						<Card>
							<CardHeader>
								<CardTitle>Formulário de Contato</CardTitle>
								<CardDescription>
									Preencha os campos abaixo para enviar sua mensagem.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleContactSubmit} className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='contactName'>Nome</Label>
										<Input
											id='contactName'
											value={contactName}
											onChange={(event) => setContactName(event.target.value)}
											placeholder='Seu nome completo'
											required
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='contactEmail'>Email</Label>
										<Input
											id='contactEmail'
											type='email'
											value={contactEmail}
											onChange={(event) => setContactEmail(event.target.value)}
											placeholder='seu@email.com'
											required
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='contactMessage'>Mensagem</Label>
										<Textarea
											id='contactMessage'
											value={contactMessage}
											onChange={(event) =>
												setContactMessage(event.target.value)
											}
											placeholder='Como podemos ajudar?'
											rows={6}
											required
										/>
									</div>
									<Button
										type='submit'
										className='w-full min-h-[44px]'
										disabled={isSendingContact}
										aria-label='Enviar mensagem de contato'
									>
										{isSendingContact ? 'Enviando...' : 'Enviar'}
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='border-t bg-gray-50 py-6 sm:py-8'>
				<div className='container mx-auto px-4'>
					<div className='flex flex-col items-center justify-center gap-2 text-center'>
						<div className='flex items-center gap-2'>
							<Calendar className='h-5 w-5 text-primary' />
							<span className='font-semibold'>Agenda</span>
						</div>
						<p className='text-sm text-gray-500'>
							&copy; {new Date().getFullYear()} Agenda. Todos os direitos reservados.
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default Home
