/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Busca detalhes de um cliente específico incluindo seus últimos agendamentos.
 * Verifica propriedade (cliente pertence ao userId) antes de retornar.
 *
 * @example
 * ```typescript
 * const client = await getClientById({ clientId: 'cli_123', userId: 'usr_456' })
 * ```
 */
'use server'
import prisma from '@/lib/prisma'

/** Parâmetros para busca de cliente por ID */
interface GetClientByIdProps {
	/** ID do cliente */
	clientId: string
	/** ID do usuário (profissional) — verificação de propriedade */
	userId: string
}

/**
 * Busca um cliente pelo ID com histórico dos últimos 20 agendamentos.
 *
 * @param props - clientId e userId para verificação de propriedade
 * @returns Cliente com agendamentos ou null se não encontrado / não pertence ao usuário
 *
 * @example
 * ```typescript
 * const client = await getClientById({ clientId: 'cli_123', userId: 'usr_456' })
 * ```
 */
export const getClientById = async ({ clientId, userId }: GetClientByIdProps) => {
	try {
		if (!clientId || !userId) {
			return null
		}

		const client = await prisma.client.findUnique({
			where: { id: clientId },
			include: {
				appointments: {
					orderBy: { appointmentDate: 'desc' },
					take: 20,
					include: {
						service: { select: { name: true, price: true, duration: true } },
						employee: { select: { name: true } },
					},
				},
				_count: { select: { appointments: true } },
			},
		})

		if (!client || client.userId !== userId) {
			return null
		}

		return client
	} catch (error) {
		console.error('Erro ao buscar cliente por ID:', {
			clientId,
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
