/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Pagina de upgrade exibida quando o trial do usuario enterprise expira.
 * Mostra resumo de uso (agendamentos, clientes, servicos), informa que o
 * periodo de avaliacao acabou e oferece CTAs para contato via WhatsApp e email.
 *
 * @example
 * // Acessada via redirect do middleware quando trialEndsAt <= now
 * // GET /dashboard/upgrade
 */
import { redirect } from 'next/navigation'
import { getUserFromToken } from '@/lib/auth'
import { getUsageSummary } from './_data-access/get-usage-summary'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Mail, MessageCircle, Users, Briefcase, UserCheck } from 'lucide-react'

/**
 * Server Component da pagina de upgrade.
 * Verifica autenticacao, busca resumo de uso e renderiza interface de bloqueio.
 */
const UpgradePage = async () => {
	const user = await getUserFromToken()
	if (!user) redirect('/')

	if (user.role === 'master') redirect('/dashboard')

	const summary = await getUsageSummary(user.id)

	const contactPhone = process.env.CONTACT_WHATSAPP || '5547999999999'
	const contactEmail = process.env.CONTACT_EMAIL || 'contato@agenda.com'
	const whatsappMessage = encodeURIComponent(
		'Olá! Meu período de avaliação expirou e gostaria de contratar o plano profissional.',
	)

	return (
		<div className='flex-1 flex items-center justify-center p-4 sm:p-6'>
			<div className='w-full max-w-lg space-y-6'>
				<Card>
					<CardHeader className='text-center'>
						<CardTitle className='text-xl sm:text-2xl'>
							Período de Avaliação Encerrado
						</CardTitle>
						<CardDescription className='text-sm sm:text-base'>
							Seu período gratuito de 30 dias chegou ao fim.
							Entre em contato para continuar usando o sistema.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='grid grid-cols-2 gap-3 sm:gap-4'>
							<div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
								<CalendarCheck className='h-5 w-5 text-primary shrink-0' />
								<div>
									<p className='text-lg sm:text-xl font-bold'>{summary.totalAppointments}</p>
									<p className='text-xs text-muted-foreground'>Agendamentos</p>
								</div>
							</div>
							<div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
								<Users className='h-5 w-5 text-primary shrink-0' />
								<div>
									<p className='text-lg sm:text-xl font-bold'>{summary.totalClients}</p>
									<p className='text-xs text-muted-foreground'>Clientes</p>
								</div>
							</div>
							<div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
								<Briefcase className='h-5 w-5 text-primary shrink-0' />
								<div>
									<p className='text-lg sm:text-xl font-bold'>{summary.totalServices}</p>
									<p className='text-xs text-muted-foreground'>Serviços</p>
								</div>
							</div>
							<div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
								<UserCheck className='h-5 w-5 text-primary shrink-0' />
								<div>
									<p className='text-lg sm:text-xl font-bold'>{summary.totalEmployees}</p>
									<p className='text-xs text-muted-foreground'>Funcionários</p>
								</div>
							</div>
						</div>

						<div className='space-y-3'>
							<Button
								className='w-full min-h-[44px] gap-2'
								asChild
							>
								<a
									href={`https://wa.me/${contactPhone}?text=${whatsappMessage}`}
									target='_blank'
									rel='noopener noreferrer'
									aria-label='Entrar em contato via WhatsApp'
								>
									<MessageCircle className='h-4 w-4' />
									Falar via WhatsApp
								</a>
							</Button>
							<Button
								variant='outline'
								className='w-full min-h-[44px] gap-2'
								asChild
							>
								<a
									href={`mailto:${contactEmail}?subject=Interesse no Plano Profissional&body=Olá, meu período de avaliação expirou e gostaria de contratar o plano.`}
									aria-label='Entrar em contato via email'
								>
									<Mail className='h-4 w-4' />
									Enviar Email
								</a>
							</Button>
						</div>

						<p className='text-xs text-center text-muted-foreground'>
							Seus dados estão seguros e serão mantidos. Ao contratar o plano,
							você terá acesso a tudo novamente.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

export default UpgradePage
