/**
 * Server Action - Update Model
 *
 * Visao geral:
 * - Action server-side para Update Model.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar entrada e contexto do usuario.
 * - Executar a regra de negocio principal.
 * - Retornar respostas consistentes.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/configurations/activity/_actions/update-model";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Schema de validação para os dados do formulário
const formSchema = z.object({
	activity: z
		.string()
		.min(1, {
			message: 'Selecione uma atividade.',
		})
		.max(50, {
			message: 'Atividade muito longa.',
		}),
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
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
		// Verifica se o be_called foi alterado e se já existe outro usuário com o mesmo nome
		if (formData.be_called !== currentUser.be_called) {
			const existingUser = await prisma.user.findUnique({
				where: { be_called: formData.be_called },
			})
			if (existingUser) {
				console.warn(
					`updateActivity: Nome já está em uso - ${formData.be_called}`,
				)
				return {
					error:
						'Este nome já está sendo utilizado. Por favor, informe outro nome.',
				}
			}
		}
		// Gera token único baseado no be_called (slugify + hash simples)
		// O token será usado na URL pública de agendamento
		let token_called = currentUser.token_called
		if (formData.be_called !== currentUser.be_called || !token_called) {
			// Gera um token único baseado no be_called
			const slug = formData.be_called
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '') // Remove acentos
				.replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
				.replace(/^-+|-+$/g, '') // Remove hífens do início e fim
			// Adiciona um hash único para garantir unicidade
			const hash =
				Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
			token_called = `${slug}-${hash}`
		}
		// Atualiza a atividade, be_called e token_called no banco de dados
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
		// Revalida o cache da página para refletir mudanças
		revalidatePath('/dashboard/configurations/activity')
		return {
			data: 'Atividade atualizada com sucesso.',
		}
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao atualizar atividade:', {
			userId: (await getUserFromToken())?.id,
			formData,
			error: error instanceof Error ? error.message : error,
		})
		return {
			error: 'Erro interno do servidor. Tente novamente.',
		}
	}
}
