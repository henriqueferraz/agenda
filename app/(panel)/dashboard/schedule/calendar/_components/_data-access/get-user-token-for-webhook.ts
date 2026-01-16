/**
 * Componente - Get User Token For Webhook
 *
 * Visao geral:
 * - Componente React para Get User Token For Webhook.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Renderizar UI com props previsiveis.
 * - Isolar estilos e comportamento do componente.
 * - Facilitar reutilizacao em outras telas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/schedule/calendar/_components/_data-access/get-user-token-for-webhook";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
/**
 *  Data Access Layer - Buscar Token para Webhook
 *
 * Busca o token_called do usuário para incluir no webhook.
 *
 * @param userId - ID do usuário
 * @returns Token único do usuário ou null
 */
export const getUserTokenForWebhook = async (
	userId: string,
): Promise<string | null> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { token_called: true },
		})
		return user?.token_called || null
	} catch (error) {
		console.error('Erro ao buscar token para webhook:', error)
		return null
	}
}
