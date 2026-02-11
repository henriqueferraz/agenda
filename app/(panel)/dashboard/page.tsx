/**
 * Pagina Server - /dashboard
 *
 * Pagina raiz do painel. Verifica autenticacao, carrega estatisticas
 * via getInfoDashboard e renderiza o componente DashboardPage.
 *
 * @example
 * // Rota acessada apos login
 * // /dashboard
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoDashboard } from './dashboard/_data-access/get-info-dashboard'
import DashboardPage from './dashboard/page'
/**
 *  Página Server - Dashboard Principal
 *
 * Página server do Next.js que carrega as estatísticas do dashboard e renderiza
 * o componente de página. Realiza verificação de autenticação e carregamento
 * de dados antes da renderização.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Redireciona se não autenticado
 *
 * 2.  Carregamento de Estatísticas
 *    └── Busca dados via getInfoDashboard
 *
 * 3.  Renderização
 *    └── Componente DashboardPage com dados
 * ```
 *
 * ## Dependências
 * - `getUserFromToken()`: Verificação de autenticação
 * - `getInfoDashboard()`: Carregamento de estatísticas
 * - `DashboardPage`: Componente de página
 *
 * ## Tratamento de Erros
 * - Não autenticado → Redirecionamento para login (/)
 * - Erro no carregamento → DashboardPage recebe valores padrão (zeros)
 *
 * @returns JSX.Element - Página renderizada com estatísticas
 */
export const Page = async () => {
	// Verificar autenticação
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}
	// Carregar estatísticas do dashboard
	const stats = await getInfoDashboard({ userId: user.id })
	return <DashboardPage stats={stats} userId={user.id} />
}

export default Page
