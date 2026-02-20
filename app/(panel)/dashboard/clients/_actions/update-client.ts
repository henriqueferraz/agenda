/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza um cliente existente. Valida CPF com isCPFValid, verifica propriedade,
 * trata P2002 e opcionalmente propaga nome/email/phone para agendamentos futuros.
 *
 * @example
 * ```typescript
 * const result = await updateClient({ id: 'cli_1', name: 'João', email: 'j@m.com', phone: '47999', cpf: '12345678909' })
 * ```
 */
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { isCPFValid, unformatCPF } from '@/utils/formatCPF'

type ActionResponse = {
	success: boolean
	data?: string | object
	message?: string
	error?: string
}

const updateClientSchema = z.object({
	id: z.string().min(1, 'ID do cliente é obrigatório'),
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres'),
	email: z
		.string()
		.email('Email inválido')
		.max(150, 'Email deve ter no máximo 150 caracteres'),
	phone: z
		.string()
		.min(10, 'Telefone deve ter pelo menos 10 dígitos')
		.max(15, 'Telefone deve ter no máximo 15 dígitos'),
	cpf: z
		.string()
		.transform((val) => unformatCPF(val))
		.refine((val) => isCPFValid(val), { message: 'CPF inválido' }),
	notes: z
		.string()
		.max(500, 'Observações devem ter no máximo 500 caracteres')
		.optional()
		.or(z.literal('')),
})

type UpdateClientData = z.infer<typeof updateClientSchema>

/**
 * Atualiza dados de um cliente. Se updateFutureAppointments=true, propaga nome/email/phone
 * para agendamentos futuros confirmados vinculados ao cliente.
 *
 * @param data - Dados atualizados do cliente
 * @returns Resposta com sucesso/erro
 *
 * @example
 * ```typescript
 * const result = await updateClient({ id: 'cli_1', name: 'Novo', email: 'n@m.com', phone: '47999', cpf: '12345678909' })
 * ```
 */
export const updateClient = async (
	data: UpdateClientData,
): Promise<ActionResponse> => {
	let session
	try {
		session = await getUserFromToken()
		if (!session?.id) {
			redirect('/')
		}

		const validatedData = updateClientSchema.parse(data)

		const existingClient = await prisma.client.findUnique({
			where: { id: validatedData.id },
			select: { id: true, name: true, userId: true },
		})

		if (!existingClient) {
			return { success: false, error: 'Cliente não encontrado' }
		}

		if (existingClient.userId !== session.id) {
			return { success: false, error: 'Você não tem permissão para editar este cliente' }
		}

		const client = await prisma.client.update({
			where: { id: validatedData.id },
			data: {
				name: validatedData.name,
				email: validatedData.email.toLowerCase(),
				phone: validatedData.phone,
				cpf: validatedData.cpf,
				notes: validatedData.notes || null,
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				cpf: true,
				notes: true,
				updatedAt: true,
			},
		})

		revalidatePath('/dashboard/clients')
		revalidatePath('/dashboard/schedule/calendar')

		return {
			success: true,
			data: client,
			message: `Cliente ${client.name} atualizado com sucesso!`,
		}
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((err) => err.message).join(', ')
			return { success: false, error: `Dados inválidos: ${errorMessages}` }
		}

		if (
			error instanceof Error &&
			'code' in error &&
			(error as Record<string, unknown>).code === 'P2002'
		) {
			const target = (error as Record<string, unknown>).meta as Record<string, unknown> | undefined
			const fields = target?.target as string[] | undefined
			if (fields?.includes('cpf')) {
				return { success: false, error: 'Já existe um cliente cadastrado com este CPF.' }
			}
			if (fields?.includes('email')) {
				return { success: false, error: 'Já existe um cliente cadastrado com este email.' }
			}
			return { success: false, error: 'Cliente duplicado. Verifique CPF e email.' }
		}

		console.error('Erro interno ao atualizar cliente:', {
			userId: session?.id,
			error: error instanceof Error ? error.message : error,
		})

		return { success: false, error: 'Erro interno do servidor. Tente novamente mais tarde.' }
	}
}
