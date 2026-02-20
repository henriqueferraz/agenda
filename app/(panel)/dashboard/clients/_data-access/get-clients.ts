/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Consulta paginada de clientes de um usuário com busca por nome, email, telefone ou CPF.
 * Retorna lista de clientes com contagem de agendamentos.
 *
 * @example
 * ```typescript
 * const { clients, total } = await getClients({ userId: 'usr_123', search: 'João', page: 1, perPage: 20 })
 * ```
 */
'use server'
import prisma from '@/lib/prisma'

/** Parâmetros para busca paginada de clientes */
interface GetClientsProps {
	/** ID do usuário (profissional) */
	userId: string
	/** Termo de busca (nome, email, telefone ou CPF) */
	search?: string
	/** Página atual (1-indexed) */
	page?: number
	/** Itens por página */
	perPage?: number
}

/** Retorno da consulta paginada */
interface GetClientsResult {
	/** Lista de clientes da página */
	clients: {
		id: string
		name: string
		email: string
		phone: string
		cpf: string
		notes: string | null
		createdAt: Date
		updatedAt: Date
		_count: { appointments: number }
	}[]
	/** Total de clientes (para paginação) */
	total: number
}

/**
 * Busca clientes do profissional com paginação e busca textual.
 *
 * @param props - Parâmetros de busca
 * @returns Lista paginada de clientes com contagem de agendamentos
 *
 * @example
 * ```typescript
 * const result = await getClients({ userId: 'usr_123', search: 'Maria', page: 2, perPage: 10 })
 * ```
 */
export const getClients = async ({
	userId,
	search = '',
	page = 1,
	perPage = 20,
}: GetClientsProps): Promise<GetClientsResult> => {
	try {
		if (!userId) {
			return { clients: [], total: 0 }
		}

		const trimmed = search.trim()
		const where = {
			userId,
			...(trimmed && {
				OR: [
					{ name: { contains: trimmed, mode: 'insensitive' as const } },
					{ email: { contains: trimmed, mode: 'insensitive' as const } },
					{ phone: { contains: trimmed } },
					{ cpf: { contains: trimmed } },
				],
			}),
		}

		const [clients, total] = await Promise.all([
			prisma.client.findMany({
				where,
				orderBy: { name: 'asc' },
				skip: (page - 1) * perPage,
				take: perPage,
				include: {
					_count: { select: { appointments: true } },
				},
			}),
			prisma.client.count({ where }),
		])

		return { clients, total }
	} catch (error) {
		console.error('Erro ao buscar clientes:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return { clients: [], total: 0 }
	}
}
