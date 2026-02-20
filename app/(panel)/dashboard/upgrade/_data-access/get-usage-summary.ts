/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Consulta de resumo de uso para a pagina de upgrade.
 * Retorna contadores de agendamentos, clientes e servicos criados pelo usuario
 * durante o periodo de trial.
 *
 * @example
 * import { getUsageSummary } from './_data-access/get-usage-summary'
 * const summary = await getUsageSummary('user_123')
 */
import prisma from '@/lib/prisma'

/** Resumo de uso do sistema durante o trial */
export interface UsageSummary {
	/** Total de agendamentos criados */
	totalAppointments: number
	/** Total de clientes cadastrados */
	totalClients: number
	/** Total de servicos ativos */
	totalServices: number
	/** Total de funcionarios ativos */
	totalEmployees: number
}

/**
 * Busca o resumo de uso do sistema para um usuario especifico.
 *
 * @param userId - ID do usuario autenticado
 * @returns Resumo com contadores de uso
 *
 * @example
 * const summary = await getUsageSummary('cmk069h7v0000o1ui5n6uk0km')
 * console.log(summary.totalAppointments) // 42
 */
export const getUsageSummary = async (userId: string): Promise<UsageSummary> => {
	const [totalAppointments, totalClients, totalServices, totalEmployees] =
		await Promise.all([
			prisma.appointment.count({ where: { userId } }),
			prisma.client.count({ where: { userId } }),
			prisma.service.count({ where: { UserId: userId, deletedAt: null } }),
			prisma.employee.count({ where: { UserId: userId, deletedAt: null } }),
		])

	return { totalAppointments, totalClients, totalServices, totalEmployees }
}
