/**
 * Pagina - /dashboard/services/employee
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/services/employee`, organizado no App Router.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoEmployee } from './_data-access/get-info-employee'
import { EmployeePageClient } from '@/app/(panel)/dashboard/services/employee/_components/employee-page-client'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
