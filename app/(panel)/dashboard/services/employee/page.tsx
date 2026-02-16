/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Página de gestão de funcionários (rota `/dashboard/services/employee`).
 * Server Component que verifica autenticação, carrega funcionários via getInfoEmployee
 * e renderiza EmployeePageClient para listar, criar, editar e excluir funcionários.
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoEmployee } from './_data-access/get-info-employee'
import { EmployeePageClient } from '@/app/(panel)/dashboard/services/employee/_components/employee-page-client'
/**
 *  Página Server - Gestão de Funcionários
 *
 * Página server do Next.js que carrega os funcionários e renderiza o componente
 * de página. Realiza verificação de autenticação e carregamento de dados antes
 * da renderização.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Redireciona se não autenticado
 *
 * 2.  Carregamento de Funcionários
 *    └── Busca dados via getInfoEmployee
 *
 * 3.  Renderização
 *    └── Componente EmployeePageClient com dados
 * ```
 *
 * ## Dependências
 * - `getUserFromToken()`: Verificação de autenticação
 * - `getInfoEmployee()`: Carregamento de funcionários
 * - `EmployeePageClient`: Componente de página
 *
 * ## Tratamento de Erros
 * - Não autenticado → Redirecionamento para login (/)
 * - Erro no carregamento → Redirecionamento para dashboard (/)
 *
 * @returns JSX.Element - Página renderizada com funcionários
 */
export const EmployeePage = async () => {
	// Verificar autenticação
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}
	// Carregar funcionários do usuário
	const employees = await getInfoEmployee({ userId: user.id })
	// Verificar se os dados foram carregados corretamente
	if (!employees) {
		redirect('/')
	}
	return <EmployeePageClient employees={employees} userId={user.id} />
}

export default EmployeePage
