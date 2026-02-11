/**
 * Data Access: busca horários de funcionamento por dia da semana do usuário para a página de configuração de horários.
 *
 * @example
 * const user = await getInfoTimes({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetInfoTimesProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações completas dos horários do usuário
 *
 * Esta função é usada para carregar os horários de funcionamento
 * de cada dia da semana do usuário, permitindo a configuração
 * completa da disponibilidade.
 *
 * @param props - Propriedades da consulta
 * @returns Dados do usuário com horários ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoTimes({ userId: "usr_123" });
 * console.log(user.mon_times); // ["08:00", "09:00", "10:00"]
 * console.log(user.sat_times); // [] (fechado aos sábados)
 * ```
 */
export const getInfoTimes = async ({ userId }: GetInfoTimesProps) => {
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoTimes: userId não fornecido')
			return null
		}
		// Busca usuário no banco de dados com todos os campos necessários
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				// Relacionamento para contexto
				subscription: true,
			},
		})
		// Verifica se usuário foi encontrado
		if (!user) {
			console.warn(`getInfoTimes: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações de horários:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
