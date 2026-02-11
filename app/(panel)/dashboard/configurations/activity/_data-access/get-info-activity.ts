/**
 * Data Access: busca dados do usuário incluindo atividade e assinatura para a página de configuração de atividade.
 *
 * @example
 * const user = await getInfoActivity({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetInfoActivityProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações do usuário incluindo atividade selecionada
 *
 * Esta função é usada para carregar os dados atuais do usuário
 * na página de configuração de atividade, permitindo que o
 * formulário seja preenchido com os valores existentes.
 *
 * @param props - Propriedades da consulta
 * @returns Dados do usuário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoActivity({ userId: "usr_123" });
 * console.log(user.activity); // "Barbearia"
 * ```
 */
export const getInfoActivity = async ({ userId }: GetInfoActivityProps) => {
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoActivity: userId não fornecido')
			return null
		}
		// Busca usuário no banco de dados com relacionamento de assinatura
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				subscription: true, // Inclui dados da assinatura se existir
			},
		})
		// Verifica se usuário foi encontrado
		if (!user) {
			console.warn(`getInfoActivity: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações de atividade:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
