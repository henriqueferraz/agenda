/**
 * Página de feriados / dias sem funcionamento (rota `/dashboard/schedule/stopday`).
 * Server Component que verifica autenticação e renderiza ModelStopDay para listar,
 * criar, editar e excluir feriados.
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ModelStopDay } from './_components/model-stopday'
/**
 *  Página de Feriados
 *
 * Página server que gerencia os dias em que a empresa não funcionará
 * (feriados). Permite ao usuário visualizar, criar, editar e deletar
 * feriados através de um formulário interativo e lista organizada.
 *
 * ## Funcionalidades
 * -  Visualização de lista de feriados
 * -  Criação de novos feriados
 * -  Edição de feriados existentes
 * -  Exclusão de feriados
 * -  Verificação de agendamentos antes de criar
 * -  Validação de datas e motivos
 *
 * ## Dados Carregados
 * - **Feriados**: Lista completa de feriados cadastrados
 * - **Componente**: ModelStopDay gerencia todo o estado e UI
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Redireciona se não autenticado
 *
 * 2.  Renderização
 *    └── Componente ModelStopDay com userId
 * ```
 *
 * ## Componentes Utilizados
 * - **ModelStopDay**: Componente principal que gerencia o estado
 * - **FormStopDay**: Formulário para criar/editar feriados
 * - **ListStopDays**: Lista de feriados com ações de editar/deletar
 *
 * ## Tratamento de Erros
 * - **Não autenticado**: Redireciona para página de login
 * - **Erros de carregamento**: Tratados nos componentes de data access
 *
 * @see {@link ModelStopDay} - Componente principal
 * @see {@link getUserFromToken} - Autenticação JWT
 */
export const StopDayPage = async () => {
	// Verificar autenticação
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}
	return <ModelStopDay userId={user.id} />
}

export default StopDayPage
