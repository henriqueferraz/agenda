/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Busca um cliente pelo CPF (apenas dígitos) dentro do escopo de um profissional.
 * Usado no autocomplete do formulário de agendamento para preencher dados automaticamente.
 *
 * @example
 * ```typescript
 * const client = await searchClientByCpf({ cpf: '12345678909', userId: 'usr_123' })
 * if (client) console.log(client.name)
 * ```
 */
'use server'
import prisma from '@/lib/prisma'

/** Parâmetros para busca por CPF */
interface SearchClientByCpfProps {
	/** CPF com apenas dígitos (11 caracteres) */
	cpf: string
	/** ID do profissional */
	userId: string
}

/** Resultado da busca por CPF */
interface SearchClientByCpfResult {
	id: string
	name: string
	email: string
	phone: string
	cpf: string
}

/**
 * Busca cliente pelo CPF vinculado a um profissional.
 *
 * @param props - CPF (dígitos) e userId
 * @returns Dados básicos do cliente ou null se não encontrado
 *
 * @example
 * ```typescript
 * const client = await searchClientByCpf({ cpf: '12345678909', userId: 'usr_123' })
 * ```
 */
export const searchClientByCpf = async ({
	cpf,
	userId,
}: SearchClientByCpfProps): Promise<SearchClientByCpfResult | null> => {
	try {
		if (!cpf || !userId || cpf.length !== 11) {
			return null
		}

		const client = await prisma.client.findFirst({
			where: { userId, cpf },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				cpf: true,
			},
		})

		return client
	} catch (error) {
		console.error('Erro ao buscar cliente por CPF:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
