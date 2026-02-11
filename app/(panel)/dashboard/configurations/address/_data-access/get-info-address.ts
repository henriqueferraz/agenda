/**
 * Data Access: busca dados do usuário incluindo endereço e assinatura para o formulário de configuração de endereço comercial.
 *
 * @example
 * const user = await getInfoAddress({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetInfoAddressProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações completas do usuário incluindo endereço e assinatura
 *
 * Esta função é usada para carregar os dados atuais do usuário
 * no formulário de edição de endereço comercial.
 *
 * @param props - Propriedades da consulta
 * @returns Dados completos do usuário com endereço ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoAddress({ userId: "usr_123" });
 * console.log(user.Address?.street); // "Rua das Flores"
 * console.log(user.Address?.zip_code);  // "12345-678"
 * ```
 */
export const getInfoAddress = async ({ userId }: GetInfoAddressProps) => {
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoAddress: userId não fornecido')
			return null
		}
		// Busca usuário no banco de dados com relacionamentos de endereço e assinatura
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				Address: true, // Inclui dados do endereço se existir
				subscription: true, // Inclui dados da assinatura se existir
			},
		})
		// Verifica se usuário foi encontrado
		if (!user) {
			console.warn(`getInfoAddress: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações do endereço:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
