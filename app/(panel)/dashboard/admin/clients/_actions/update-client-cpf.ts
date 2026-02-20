/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Server action para atualizar o CPF de um cliente.
 * Exclusiva para usuarios com role master. Valida CPF via algoritmo oficial
 * e garante unicidade dentro do mesmo userId (@@unique([userId, cpf])).
 *
 * @example
 * import { updateClientCpf } from './_actions/update-client-cpf'
 * const result = await updateClientCpf({ clientId: 'cli_1', cpf: '12345678909' })
 */
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { isCPFValid, unformatCPF } from '@/utils/formatCPF'

const updateClientCpfSchema = z.object({
	clientId: z.string().min(1, 'ID do cliente é obrigatório'),
	cpf: z.string().min(11, 'CPF é obrigatório'),
})

/**
 * Atualiza o CPF de um cliente. Valida formato, verifica unicidade
 * dentro do mesmo usuario proprietario e aplica a atualizacao.
 *
 * @param data - Objeto com clientId e cpf
 * @returns Objeto com success e message, ou error
 *
 * @example
 * const result = await updateClientCpf({ clientId: 'clk...', cpf: '271.823.220-05' })
 */
export const updateClientCpf = async (data: {
	clientId: string
	cpf: string
}) => {
	try {
		const session = await getUserFromToken()
		if (!session) {
			return { success: false, error: 'Não autenticado.' }
		}

		if (session.role !== 'master') {
			return { success: false, error: 'Acesso negado. Somente administradores.' }
		}

		const parsed = updateClientCpfSchema.safeParse(data)
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
		}

		const cleanCpf = unformatCPF(parsed.data.cpf)

		if (!isCPFValid(cleanCpf)) {
			return { success: false, error: 'CPF inválido.' }
		}

		const client = await prisma.client.findUnique({
			where: { id: parsed.data.clientId },
			select: { id: true, name: true, cpf: true, userId: true },
		})

		if (!client) {
			return { success: false, error: 'Cliente não encontrado.' }
		}

		if (cleanCpf !== client.cpf) {
			const existingCpf = await prisma.client.findFirst({
				where: {
					userId: client.userId,
					cpf: cleanCpf,
					id: { not: client.id },
				},
			})

			if (existingCpf) {
				return { success: false, error: 'Este CPF já está em uso por outro cliente deste usuário.' }
			}
		}

		await prisma.client.update({
			where: { id: parsed.data.clientId },
			data: { cpf: cleanCpf },
		})

		revalidatePath('/dashboard/admin/clients')

		return {
			success: true,
			message: `CPF de ${client.name} atualizado com sucesso.`,
		}
	} catch (error) {
		console.error('Erro ao atualizar CPF do cliente:', error)
		return { success: false, error: 'Erro interno ao atualizar CPF.' }
	}
}
