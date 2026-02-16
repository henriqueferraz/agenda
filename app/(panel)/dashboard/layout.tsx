/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Layout do painel (rota `/dashboard`).
 * Protege a rota com autenticação (redireciona para `/` se não autenticado) e renderiza
 * SidebarProvider + AppSidebar com o conteúdo das páginas filhas.
 */
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getUserFromToken } from '@/lib/auth'
interface DashboardLayoutProps {
	children: ReactNode
}
/**
 * Layout principal do dashboard
 * Aplica proteção de rota e estrutura de navegação
 */
export const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
	// Verifica se o usuário está autenticado
	// Em Server Components, podemos acessar a sessão diretamente
	const user = await getUserFromToken()
	// Se não há sessão, redireciona para a página de login
	if (!user) {
		redirect('/')
	}
	return (
		<SidebarProvider>
			{/* Sidebar de navegação lateral */}
			<AppSidebar />

			{/* Conteúdo principal das páginas filhas */}
			{children}
		</SidebarProvider>
	)
}

export default DashboardLayout
