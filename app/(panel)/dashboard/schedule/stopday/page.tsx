/**
 * Pagina - /dashboard/schedule/stopday
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/schedule/stopday`, organizado no App Router.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/stopday/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ModelStopDay } from './_components/model-stopday'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
