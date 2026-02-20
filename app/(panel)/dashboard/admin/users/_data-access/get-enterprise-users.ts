/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Consulta de usuarios enterprise para o painel admin do MASTER.
 * Retorna lista paginada de usuarios com role enterprise, incluindo
 * nome, email, CPF, data de criacao e data de fim do trial.
 *
 * @example
 * import { getEnterpriseUsers } from './_data-access/get-enterprise-users'
 * const { users, total } = await getEnterpriseUsers()
 */
import prisma from '@/lib/prisma'

/** Representacao de um usuario enterprise no painel admin */
export interface EnterpriseUserItem {
	/** ID do usuario */
	id: string
	/** Nome do usuario */
	name: string | null
	/** Email do usuario */
	email: string
	/** CPF do usuario */
	cpf: string | null
	/** CNPJ do usuario */
	cnpj: string | null
	/** Data de criacao da conta */
	createdAt: Date
	/** Data de fim do trial */
	trialEndsAt: Date | null
	/** Se o usuario esta ativo */
	status: boolean
}

/** Resultado paginado da consulta de usuarios enterprise */
export interface EnterpriseUsersResult {
	/** Lista de usuarios enterprise */
	users: EnterpriseUserItem[]
	/** Total de usuarios enterprise */
	total: number
}

/**
 * Busca usuarios com role enterprise para o painel admin.
 *
 * @param page - Numero da pagina (1-indexed), padrao 1
 * @param pageSize - Itens por pagina, padrao 20
 * @returns Lista paginada de usuarios enterprise com total
 *
 * @example
 * const { users, total } = await getEnterpriseUsers(1, 10)
 */
export const getEnterpriseUsers = async (
	page = 1,
	pageSize = 20,
): Promise<EnterpriseUsersResult> => {
	const skip = (page - 1) * pageSize

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where: { role: 'enterprise' },
			select: {
				id: true,
				name: true,
				email: true,
				cpf: true,
				cnpj: true,
				createdAt: true,
				trialEndsAt: true,
				status: true,
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: pageSize,
		}),
		prisma.user.count({ where: { role: 'enterprise' } }),
	])

	return { users, total }
}
