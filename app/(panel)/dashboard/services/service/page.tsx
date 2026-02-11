/**
 * Página de gestão de serviços (rota `/dashboard/services/service`).
 * Server Component que verifica autenticação, carrega serviços via getInfoService
 * e renderiza ServicePageClient para listar, criar, editar e excluir serviços.
 */
import { getUserFromToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getInfoService } from './_data-access/get-info-service'
import { ServicePageClient } from './_components/service-page-client'
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
