/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca horários da empresa, funcionários ativos com serviços e serviços ativos
 * para a página pública de agendamento (SEM verificação de autenticação).
 *
 * @example
 * const data = await getPublicCalendarData({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'

interface GetPublicCalendarDataProps {
	/** ID único do usuário */
	userId: string
}

/**
 * Busca todos os dados necessários para o calendário público
 *
 * Esta função é executada no servidor e realiza múltiplas consultas para
 * buscar horários da empresa, funcionários ativos com serviços e serviços
 * ativos da empresa. NÃO requer autenticação (para uso em páginas públicas).
 *
 * @param props - Propriedades da consulta
 * @returns Dados completos do calendário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const calendarData = await getPublicCalendarData({ userId: "usr_123" });
 * if (calendarData) {
 *   console.log(calendarData.companyTimes.mon_times); // ["08:00", "09:00"]
 *   console.log(calendarData.employees.length); // 3
 *   console.log(calendarData.services.length); // 5
 * }
 * ```
 */
export const getPublicCalendarData = async ({
	userId,
}: GetPublicCalendarDataProps) => {
	try {
		if (!userId) {
			console.warn('getPublicCalendarData: userId não fornecido')
			return null
		}

		// Busca horários da empresa
		const company = await prisma.user.findUnique({
			where: { id: userId },
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

		if (!company) {
			console.warn(`getPublicCalendarData: Usuário ${userId} não encontrado`)
			return null
		}

		// Busca funcionários ativos (não soft-deleted) com serviços relacionados
		const employees = await prisma.employee.findMany({
			where: {
				UserId: userId,
				status: true,
				deletedAt: null,
			},
			include: {
				services: {
					include: {
						service: true,
					},
				},
			},
			orderBy: {
				name: 'asc',
			},
		})

		// Busca serviços ativos (não soft-deleted) da empresa
		const services = await prisma.service.findMany({
			where: {
				UserId: userId,
				status: true,
				deletedAt: null,
			},
			orderBy: {
				name: 'asc',
			},
		})

		return {
			companyTimes: company,
			employees,
			services,
		}
	} catch (error) {
		console.error('Erro ao buscar dados do calendário público:', {
			userId,
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
		})
		return null
	}
}
