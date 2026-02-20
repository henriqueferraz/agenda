/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Layout do painel (rota `/dashboard`).
 * Protege a rota com autenticacao (redireciona para `/` se nao autenticado),
 * exibe banner de trial para usuarios enterprise e renderiza
 * SidebarProvider + AppSidebar com o conteudo das paginas filhas.
 */
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getUserFromToken } from '@/lib/auth'
import { TrialBanner } from './_components/trial-banner'

interface DashboardLayoutProps {
	children: ReactNode
}

/**
 * Layout principal do dashboard.
 * Aplica protecao de rota, exibe trial banner e estrutura de navegacao.
 */
export const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
	const user = await getUserFromToken()
	if (!user) {
		redirect('/')
	}
	return (
		<SidebarProvider>
			<AppSidebar userRole={user.role} />
			<div className='flex flex-col flex-1 min-w-0'>
				<div className='p-2 sm:p-3'>
					<TrialBanner
						role={user.role}
						trialEndsAt={user.trialEndsAt}
					/>
				</div>
				{children}
			</div>
		</SidebarProvider>
	)
}

export default DashboardLayout
