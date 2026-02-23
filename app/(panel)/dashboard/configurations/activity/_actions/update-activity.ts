/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza a atividade profissional do usuário (activity, be_called)
 * e gera/atualiza o token_called usado na URL pública de agendamento.
 * Valida autenticação, unicidade de be_called e persiste no User via Prisma.
 *
 * @example
 * import { updateActivity } from "@/app/(panel)/dashboard/configurations/activity/_actions/update-activity";
 * const result = await updateActivity({ activity: "Barbearia", be_called: "Joao" });
 */
'use server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { ALLOWED_ACTIVITIES } from '@/lib/constants/activities'
const formSchema = z.object({
	activity: z
		.string()
		.min(1, {
			message: 'Selecione uma atividade.',
		})
		.refine(
			(value) =>
				(ALLOWED_ACTIVITIES as readonly string[]).includes(value),
			{
				message: 'Atividade inválida.',
			},
		),
	be_called: z
		.string()
		.min(1, {
			message: 'Este campo é obrigatório.',
		})
		.max(100, {
			message: 'O nome deve ter no máximo 100 caracteres.',
		}),
})
// Tipo inferido do schema Zod
type FormSchema = z.infer<typeof formSchema>
/**
 * Atualiza a atividade profissional, o nome de preferência e gera token único
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada
 * 3. Verificação de unicidade do campo be_called
 * 4. Geração de token único (token_called) baseado no be_called
 * 5. Atualização no banco de dados (activity, be_called e token_called)
 * 6. Revalidação do cache das páginas
 *
 * ## Geração de Token
 * O token é gerado automaticamente quando be_called é definido ou alterado:
 * - Baseado no be_called (slugify + hash único)
 * - Formato: `nome-empresa-abc123`
 * - Único no banco de dados (@unique)
 * - Usado na URL pública: `/agendamento/[token]`
 *
 * @param formData - Dados do formulário de atividade (activity e be_called)
 * @returns Objeto com resultado da operação
 *
 * @example
 * ```typescript
 * const result = await updateActivity({
 *   activity: "Barbearia",
 *   be_called: "João"
 * });
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data); // "Atividade atualizada com sucesso."
 * }
 * ```
 */
export const updateActivity = async (formData: FormSchema) => {
	try {
		// Verifica autenticação do usuário
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				error: 'Usuário não autenticado. Faça login novamente.',
			}
		}
		// Valida os dados de entrada usando Zod
		const schema = formSchema.safeParse(formData)
		if (!schema.success) {
			// Retorna primeira mensagem de erro encontrada
			const errorMessage =
				schema.error.issues[0]?.message ||
				'Dados inválidos. Verifique os campos.'
			return {
				error: errorMessage,
			}
		}
		// Busca o usuário atual para verificar se o be_called foi alterado
		const currentUser = await prisma.user.findUnique({
			where: { id: session.id },
			select: { be_called: true, token_called: true },
		})
		if (!currentUser) {
			return {
				error: 'Usuário não encontrado.',
			}
		}
		// Gera token unico baseado no be_called (slugify + hash criptografico)
		// O token sera usado na URL publica de agendamento
		let token_called = currentUser.token_called
		if (formData.be_called !== currentUser.be_called || !token_called) {
			const slug = formData.be_called
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '') // Remove acentos
				.replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hifen
				.replace(/^-+|-+$/g, '') // Remove hifens do inicio e fim
			// Hash criptograficamente seguro para garantir unicidade
			const hash = randomBytes(4).toString('hex')
			token_called = `${slug}-${hash}`
		}
		// Atualiza no banco tratando erro de constraint unica (race condition safe)
		try {
			await prisma.user.update({
				where: {
					id: session.id,
				},
				data: {
					activity: formData.activity,
					be_called: formData.be_called,
					token_called: token_called,
				},
			})
		} catch (prismaError: unknown) {
			// Trata erro de constraint unica (be_called ou token_called duplicado)
			if (
				prismaError &&
				typeof prismaError === 'object' &&
				'code' in prismaError &&
				prismaError.code === 'P2002'
			) {
				return {
					error:
						'Este nome já está sendo utilizado. Por favor, informe outro nome.',
				}
			}
			throw prismaError
		}
		revalidatePath('/dashboard/configurations/activity')
		revalidatePath('/dashboard/dashboard')
		return {
			data: 'Atividade atualizada com sucesso.',
		}
	} catch (error) {
		console.error('Erro ao atualizar atividade:', {
			error: error instanceof Error ? error.message : error,
		})
		return {
			error: 'Erro interno do servidor. Tente novamente.',
		}
	}
}
