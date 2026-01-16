/**
 * Layout - /dashboard
 *
 * Visao geral:
 * - Layout compartilhado para a rota `/dashboard`.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Fornecer estrutura base para a hierarquia de rotas.
 * - Centralizar wrappers e providers da rota.
 * - Garantir consistencia visual entre paginas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/layout";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { getUserFromToken } from '@/lib/auth'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
