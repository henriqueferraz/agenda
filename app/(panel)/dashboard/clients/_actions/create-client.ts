/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Server action que cria um novo cliente para o usuário autenticado. Valida CPF com algoritmo
 * oficial via isCPFValid, normaliza com unformatCPF. Trata erro Prisma P2002 (unicidade email/CPF).
 *
 * @example
 * ```typescript
 * import { createClient } from './_actions/create-client'
 * const result = await createClient({ name: 'João', email: 'joao@mail.com', phone: '47999998888', cpf: '12345678909' })
 * ```
 */
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { isCPFValid, unformatCPF } from '@/utils/formatCPF'
import { getPostHogClient } from '@/lib/posthog-server'

type ActionResponse = {
	success: boolean
	data?: string | object
	message?: string
	error?: string
}

const createClientSchema = z.object({
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

type CreateClientData = z.infer<typeof createClientSchema>

/**
 * Cria um novo cliente vinculado ao profissional autenticado.
 *
 * @param data - Dados do cliente (nome, email, telefone, cpf, notes?)
 * @returns Resposta com sucesso/erro e dados do cliente criado
 *
 * @example
 * ```typescript
 * const result = await createClient({ name: 'Maria', email: 'maria@mail.com', phone: '47999887766', cpf: '12345678909' })
 * ```
 */
export const createClient = async (
	data: CreateClientData,
): Promise<ActionResponse> => {
	let session
	try {
		session = await getUserFromToken()
		if (!session?.id) {
			redirect('/')
		}

		const validatedData = createClientSchema.parse(data)

		const client = await prisma.client.create({
			data: {
				name: validatedData.name,
				email: validatedData.email.toLowerCase(),
				phone: validatedData.phone,
				cpf: validatedData.cpf,
				notes: validatedData.notes || null,
				userId: session.id,
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				cpf: true,
				notes: true,
				createdAt: true,
			},
		})

		revalidatePath('/dashboard/clients')

		const posthog = getPostHogClient()
		posthog.capture({
			distinctId: session.id,
			event: 'client_created',
			properties: {
				client_id: client.id,
			},
		})

		return {
			success: true,
			data: client,
			message: `Cliente ${client.name} cadastrado com sucesso!`,
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

		console.error('Erro interno ao criar cliente:', {
			userId: session?.id,
			error: error instanceof Error ? error.message : error,
		})

		return { success: false, error: 'Erro interno do servidor. Tente novamente mais tarde.' }
	}
}
