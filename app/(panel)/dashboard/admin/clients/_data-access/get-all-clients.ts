/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Consulta global de clientes para o painel admin do MASTER.
 * Retorna todos os clientes de todos os usuarios enterprise,
 * com paginacao e busca por nome ou CPF, incluindo o nome do usuario proprietario.
 *
 * @example
 * import { getAllClients } from './_data-access/get-all-clients'
 * const { clients, total } = await getAllClients(1, 20, 'silva')
 */
import prisma from '@/lib/prisma'

/** Representacao de um cliente no painel admin global */
export interface AdminClientItem {
	/** ID do cliente */
	id: string
	/** Nome do cliente */
	name: string
	/** Email do cliente */
	email: string
	/** Telefone do cliente */
	phone: string
	/** CPF do cliente */
	cpf: string
	/** Nome do usuario proprietario (empresa) */
	ownerName: string | null
	/** Email do usuario proprietario */
	ownerEmail: string
	/** ID do usuario proprietario */
	userId: string
}

/** Resultado paginado da consulta global de clientes */
export interface AllClientsResult {
	/** Lista de clientes */
	clients: AdminClientItem[]
	/** Total de clientes encontrados */
	total: number
}

/**
 * Busca todos os clientes de todos os usuarios com paginacao e busca.
 *
 * @param page - Numero da pagina (1-indexed), padrao 1
 * @param pageSize - Itens por pagina, padrao 20
 * @param search - Termo de busca por nome ou CPF (opcional)
 * @returns Lista paginada de clientes com total
 *
 * @example
 * const { clients, total } = await getAllClients(1, 20, '123.456')
 */
export const getAllClients = async (
	page = 1,
	pageSize = 20,
	search?: string,
): Promise<AllClientsResult> => {
	const skip = (page - 1) * pageSize

	const where = search
		? {
			OR: [
				{ name: { contains: search, mode: 'insensitive' as const } },
				{ cpf: { contains: search.replace(/\D/g, '') } },
				{ email: { contains: search, mode: 'insensitive' as const } },
			],
		}
		: {}

	const [rawClients, total] = await Promise.all([
		prisma.client.findMany({
			where,
			include: {
				user: {
					select: { name: true, email: true },
				},
			},
			orderBy: { name: 'asc' },
			skip,
			take: pageSize,
		}),
		prisma.client.count({ where }),
	])

	const clients: AdminClientItem[] = rawClients.map((c) => ({
		id: c.id,
		name: c.name,
		email: c.email,
		phone: c.phone,
		cpf: c.cpf,
		ownerName: c.user.name,
		ownerEmail: c.user.email,
		userId: c.userId,
	}))

	return { clients, total }
}
