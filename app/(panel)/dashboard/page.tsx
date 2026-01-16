/**
 * Pagina - /dashboard
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard`, organizado no App Router.
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
 * import * as modulo from "@/app/(panel)/dashboard/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoDashboard } from './dashboard/_data-access/get_info_dashboard'
import DashboardPage from './dashboard/page'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
