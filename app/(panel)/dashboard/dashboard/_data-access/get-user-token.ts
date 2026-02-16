/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca o token único (token_called) do usuário para montar a URL pública de agendamento.
 *
 * @example
 * const token = await getUserToken({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetUserTokenProps {
	/** ID único do usuário */
	userId: string
}
/**
 *  Data Access Layer - Buscar Token de Agendamento Público
 *
 * Camada de acesso a dados responsável por buscar o token único
 * (token_called) do usuário para gerar a URL pública de agendamento.
 *
 * @param props - Propriedades da consulta
 * @returns Token único do usuário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const token = await getUserToken({ userId: "usr_123" });
 * if (token) {
 *   const url = `${process.env.NEXT_PUBLIC_BASE_URL}/agendamento/${token}`;
 * }
 * ```
 */
export const getUserToken = async ({
	userId,
}: GetUserTokenProps): Promise<string | null> => {
	try {
		if (!userId) {
			console.warn('getUserToken: userId não fornecido')
			return null
		}
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { token_called: true },
		})
		return user?.token_called || null
	} catch (error) {
		console.error('Erro ao buscar token do usuário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
