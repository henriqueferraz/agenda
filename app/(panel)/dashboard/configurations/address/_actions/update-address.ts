/**
 * Server Action - Update Address
 *
 * Visao geral:
 * - Action server-side para Update Address.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/address/_actions/update-address";
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
// Schema de validação para os dados do formulário de endereço
const formSchema = z.object({
	// CEP é obrigatório e deve ter formato válido
	zip_code: z
		.string()
		.min(8, { message: 'CEP deve ter pelo menos 8 caracteres.' })
		.max(9, { message: 'CEP deve ter no máximo 9 caracteres.' })
		.regex(/^\d{5}-?\d{3}$/, {
			message: 'CEP deve estar no formato 00000-000 ou 00000000.',
		}),
	// Logradouro é obrigatório
	street: z
		.string()
		.min(3, { message: 'Logradouro deve ter pelo menos 3 caracteres.' })
		.max(100, { message: 'Logradouro deve ter no máximo 100 caracteres.' }),
	// Número é obrigatório
	number: z
		.string()
		.min(1, { message: 'Número é obrigatório.' })
		.max(20, { message: 'Número deve ter no máximo 20 caracteres.' }),
	// Complemento é opcional
	complement: z
		.string()
		.max(50, { message: 'Complemento deve ter no máximo 50 caracteres.' })
		.optional(),
	// Bairro é obrigatório
	neighborhood: z
		.string()
		.min(2, { message: 'Bairro deve ter pelo menos 2 caracteres.' })
		.max(50, { message: 'Bairro deve ter no máximo 50 caracteres.' }),
	// Cidade é obrigatória
	city: z
		.string()
		.min(2, { message: 'Cidade deve ter pelo menos 2 caracteres.' })
		.max(50, { message: 'Cidade deve ter no máximo 50 caracteres.' }),
	// Estado é obrigatório e deve ser UF válida
	state: z
		.string()
		.length(2, { message: 'Estado deve ter exatamente 2 caracteres (UF).' })
		.regex(
			/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/i,
			{
				message: 'Estado deve ser uma UF válida (ex: SP, RJ, MG).',
			},
		),
	// País é obrigatório
	country: z
		.string()
		.min(2, { message: 'País deve ter pelo menos 2 caracteres.' })
		.max(50, { message: 'País deve ter no máximo 50 caracteres.' }),
})
type FormSchema = z.infer<typeof formSchema>
/**
 * Atualiza o endereço comercial do usuário
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada
 * 3. Verificação de endereço existente (CREATE ou UPDATE)
 * 4. Atualização no banco de dados (tabelas Address + User)
 * 5. Revalidação do cache das páginas
 *
 * @param formData - Dados do formulário de endereço
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * const result = await updateAddress({
 *   zip_code: "12345-678",
 *   street: "Rua das Flores",
 *   number: "123",
 *   neighborhood: "Centro",
 *   city: "São Paulo",
 *   state: "SP",
 *   country: "Brasil"
 * });
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data); // "Endereço atualizado com sucesso."
 * }
 * ```
 */
export const updateAddress = async (formData: FormSchema) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const session = await getUserFromToken()
	if (!session?.id) {
		return {
			error: 'Usuário não autenticado.',
		}
	}
	const schema = formSchema.safeParse(formData)
	if (!schema.success) {
		return {
			error: 'Preencha todos os campos obrigatórios corretamente.',
		}
	}
	try {
		// Verificar se o usuário já tem um endereço
		const existingAddress = await prisma.address.findUnique({
			where: {
				UserId: session.id,
			},
		})
		if (existingAddress) {
			// Atualizar endereço existente
			await prisma.address.update({
				where: {
					UserId: session.id,
				},
				data: {
					street: formData.street,
					number: formData.number,
					complement: formData.complement || '',
					neighborhood: formData.neighborhood,
					city: formData.city,
					state: formData.state,
					zip_code: formData.zip_code,
					country: formData.country,
					updatedAt: new Date(),
				},
			})
		} else {
			// Criar novo endereço
			await prisma.address.create({
				data: {
					id: crypto.randomUUID(),
					UserId: session.id,
					street: formData.street,
					number: formData.number,
					complement: formData.complement || '',
					neighborhood: formData.neighborhood,
					city: formData.city,
					state: formData.state,
					zip_code: formData.zip_code,
					country: formData.country,
					updatedAt: new Date(),
				},
			})
		}
		// Atualizar o campo address do usuário (referência ao CEP)
		await prisma.user.update({
			where: {
				id: session.id,
			},
			data: {
				address: formData.zip_code,
			},
		})
		revalidatePath('/dashboard/configurations/address')
		return {
			data: 'Endereço atualizado com sucesso.',
		}
	} catch (error) {
		console.log(error)
		return {
			error: 'Erro ao atualizar o endereço.',
		}
	}
}
