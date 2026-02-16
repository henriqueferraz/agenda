/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca os horários de funcionamento por dia da semana (mon_times, tue_times, etc.) da empresa.
 *
 * @example
 * const companyTimes = await getCompanyTimes({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
interface GetCompanyTimesProps {
	/** ID único do usuário (empresa) */
	userId: string
}
/**
 * Busca os horários de funcionamento da empresa
 *
 * @param props - Propriedades da consulta
 * @returns Horários da empresa ou null se não encontrado
 *
 * @example
 * ```typescript
 * const companyTimes = await getCompanyTimes({ userId: "usr_123" });
 * console.log(companyTimes.mon_times); // ["08:00", "09:00", "10:00"]
 * ```
 */
export const getCompanyTimes = async ({ userId }: GetCompanyTimesProps) => {
	try {
		if (!userId) {
			console.warn('getCompanyTimes: userId não fornecido')
			return null
		}
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				mon_times: true,
				tue_times: true,
				wed_times: true,
				thu_times: true,
				fri_times: true,
				sat_times: true,
				sun_times: true,
			},
		})
		if (!user) {
			console.warn(`getCompanyTimes: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		console.error('Erro ao buscar horários da empresa:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
