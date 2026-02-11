/**
 * Server action que atualiza o modelo de negócio do usuário (nome, CPF, CNPJ, telefone).
 * Valida autenticação e dados com Zod (CPF/CNPJ condicional) e persiste no User.
 *
 * @example
 * import { updateModel } from "@/app/(panel)/dashboard/configurations/model/_actions/update-model";
 * const result = await updateModel({ name: "João", cpf: "123.456.789-00", phone: "(11) 99999-9999" });
 */
'use server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
// Schema de validação para os dados do formulário de modelo
const formSchema = z
	.object({
		// Nome é sempre obrigatório
		name: z
			.string()
			.min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
			.max(100, { message: 'O nome deve ter no máximo 100 caracteres.' }),
		// Campos opcionais (dependem do tipo de pessoa)
		cnpj: z.string().optional(),
		phone: z.string().optional(),
		cpf: z.string().optional(),
	})
	.refine(
		(data) => {
			// Validação condicional: se CNPJ fornecido, deve ser válido
			if (data.cnpj && data.cnpj.trim() !== '') {
				const cleanCNPJ = data.cnpj.replace(/\D/g, '')
				if (cleanCNPJ.length !== 14) {
					return false
				}
				// Aqui seria chamada a validação completa do CNPJ
				// Por simplicidade, apenas verificamos o tamanho
			}
			// Validação condicional: se CPF fornecido, deve ser válido
			if (data.cpf && data.cpf.trim() !== '') {
				const cleanCPF = data.cpf.replace(/\D/g, '')
				if (cleanCPF.length !== 11) {
					return false
				}
				// Aqui seria chamada a validação completa do CPF
				// Por simplicidade, apenas verificamos o tamanho
			}
			return true
		},
		{
			message: 'CPF ou CNPJ inválido.',
			path: ['cpf'], // Erro será atribuído ao campo CPF
		},
	)
type FormSchema = z.infer<typeof formSchema>
/**
 * Atualiza o modelo de negócio do usuário (Pessoa Física ou Jurídica)
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada (CPF/CNPJ condicional)
 * 3. Atualização no banco de dados
 * 4. Revalidação do cache das páginas
 *
 * @param formData - Dados do formulário de modelo (nome, CPF/CNPJ, telefone)
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * // Pessoa Física
 * const result = await updateModel({
 *   name: "João Silva",
 *   cpf: "123.456.789-00",
 *   phone: "(11) 99999-9999"
 * });
 *
 * // Pessoa Jurídica
 * const result = await updateModel({
 *   name: "Empresa XYZ Ltda",
 *   cnpj: "11.222.333/0001-81",
 *   phone: "(11) 99999-9999"
 * });
 *
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data); // "Dados atualizados com sucesso."
 * }
 * ```
 */
export const updateModel = async (formData: FormSchema) => {
	const session = await getUserFromToken()
	if (!session?.id) {
		return {
			error: 'Usuário não autenticado.',
		}
	}
	const schema = formSchema.safeParse(formData)
	if (!schema.success) {
		return {
			error: 'Preencha todos os campos obrigatórios.',
		}
	}
	try {
		await prisma.user.update({
			where: {
				id: session?.id,
			},
			data: {
				name: formData.name,
				cnpj: formData.cnpj,
				phone: formData.phone,
				cpf: formData.cpf,
			},
		})
		revalidatePath('/dashboard/configurations/model')
		return {
			data: 'Dados atualizados com sucesso.',
		}
	} catch {
		return {
			error: 'Erro ao atualizar os dados.',
		}
	}
}
