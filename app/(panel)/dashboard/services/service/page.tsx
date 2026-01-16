/**
 * Pagina - /dashboard/services/service
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/services/service`, organizado no App Router.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/service/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoService } from './_data-access/get_info_service'
import { ServicePageClient } from './_components/service-page-client'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
/**
 *  Página Server - Gestão de Serviços
 *
 * Página server do Next.js que carrega os serviços e renderiza o componente
 * de página. Realiza verificação de autenticação e carregamento de dados antes
 * da renderização.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Redireciona se não autenticado
 *
 * 2.  Carregamento de Serviços
 *    └── Busca dados via getInfoService
 *
 * 3.  Renderização
 *    └── Componente ServicePageClient com dados
 * ```
 *
 * ## Dependências
 * - `getUserFromToken()`: Verificação de autenticação
 * - `getInfoService()`: Carregamento de serviços
 * - `ServicePageClient`: Componente de página
 *
 * ## Tratamento de Erros
 * - Não autenticado → Redirecionamento para login (/)
 * - Erro no carregamento → Array vazio (não redireciona)
 *
 * @returns JSX.Element - Página renderizada com serviços
 */
export const ServicePage = async () => {
	// Verificar autenticação
	const user = await getUserFromToken()
	if (!user?.id) {
		redirect('/')
	}
	// Carregar serviços do usuário
	const services = await getInfoService({ userId: user.id })
	// Se não houver serviços, retorna array vazio (não redireciona)
	const servicesList = services || []
	return <ServicePageClient services={servicesList} />
}

export default ServicePage
