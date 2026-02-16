/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca dados completos do usuário incluindo assinatura para formulários de edição de perfil (pessoa física/jurídica).
 *
 * @example
 * const user = await getInfoUser({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetInfoUserProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações completas do usuário incluindo assinatura
 *
 * Esta função é usada para carregar os dados atuais do usuário
 * nos formulários de edição de perfil (pessoa física/jurídica).
 *
 * @param props - Propriedades da consulta
 * @returns Dados completos do usuário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoUser({ userId: "usr_123" });
 * console.log(user.name); // "João Silva"
 * console.log(user.cpf);  // "123.456.789-00"
 * ```
 */
export const getInfoUser = async ({ userId }: GetInfoUserProps) => {
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoUser: userId não fornecido')
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
			console.warn(`getInfoUser: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações do usuário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
