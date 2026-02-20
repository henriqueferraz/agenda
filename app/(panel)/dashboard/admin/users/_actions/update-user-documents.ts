/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Server action para atualizar CPF e/ou CNPJ de um usuario enterprise.
 * Exclusiva para usuarios com role master. Valida documentos via algoritmos
 * oficiais e garante unicidade de CPF no banco.
 *
 * @example
 * import { updateUserDocuments } from './_actions/update-user-documents'
 * const result = await updateUserDocuments({ userId: 'usr_1', cpf: '12345678909', cnpj: '11222333000181' })
 */
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { isCPFValid, unformatCPF } from '@/utils/formatCPF'
import { isCNPJValid, unformatCNPJ } from '@/utils/formatCNPJ'

const updateDocumentsSchema = z.object({
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
	cpf: z.string().optional(),
	cnpj: z.string().optional(),
})

/**
 * Atualiza CPF e/ou CNPJ de um usuario enterprise.
 * Valida formato dos documentos, verifica unicidade de CPF e aplica a atualizacao.
 *
 * @param data - Objeto com userId e campos opcionais cpf e cnpj
 * @returns Objeto com success e message, ou error
 *
 * @example
 * const result = await updateUserDocuments({ userId: 'cmk069h7v0001o1ui1234abcd', cpf: '271.823.220-05' })
 */
export const updateUserDocuments = async (data: {
	userId: string
	cpf?: string
	cnpj?: string
}) => {
	try {
		const session = await getUserFromToken()
		if (!session) {
			return { success: false, error: 'Não autenticado.' }
		}

		if (session.role !== 'master') {
			return { success: false, error: 'Acesso negado. Somente administradores.' }
		}

		const parsed = updateDocumentsSchema.safeParse(data)
		if (!parsed.success) {
			return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' }
		}

		const { userId, cpf, cnpj } = parsed.data

		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, role: true, cpf: true, cnpj: true },
		})

		if (!targetUser) {
			return { success: false, error: 'Usuário não encontrado.' }
		}

		if (targetUser.role !== 'enterprise') {
			return { success: false, error: 'Somente usuários enterprise podem ser editados.' }
		}

		const updateData: Record<string, string | null> = {}

		if (cpf !== undefined && cpf !== '') {
			const cleanCpf = unformatCPF(cpf)
			if (!isCPFValid(cleanCpf)) {
				return { success: false, error: 'CPF inválido.' }
			}

			if (cleanCpf !== targetUser.cpf) {
				const existingCpf = await prisma.user.findUnique({ where: { cpf: cleanCpf } })
				if (existingCpf && existingCpf.id !== userId) {
					return { success: false, error: 'Este CPF já está em uso por outro usuário.' }
				}
			}

			updateData.cpf = cleanCpf
		} else if (cpf === '') {
			updateData.cpf = null
		}

		if (cnpj !== undefined && cnpj !== '') {
			const cleanCnpj = unformatCNPJ(cnpj)
			if (!isCNPJValid(cleanCnpj)) {
				return { success: false, error: 'CNPJ inválido.' }
			}
			updateData.cnpj = cleanCnpj
		} else if (cnpj === '') {
			updateData.cnpj = null
		}

		if (Object.keys(updateData).length === 0) {
			return { success: false, error: 'Nenhum dado para atualizar.' }
		}

		await prisma.user.update({
			where: { id: userId },
			data: updateData,
		})

		revalidatePath('/dashboard/admin/users')

		return {
			success: true,
			message: `Documentos de ${targetUser.name || 'usuário'} atualizados com sucesso.`,
		}
	} catch (error) {
		console.error('Erro ao atualizar documentos:', error)
		return { success: false, error: 'Erro interno ao atualizar documentos.' }
	}
}
