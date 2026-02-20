/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza o modelo de negócio do usuário (nome fantasia, nome, CPF, CNPJ, telefone).
 * Valida autenticação e dados com Zod (CPF/CNPJ condicional) e persiste no User.
 *
 * @example
 * import { updateModel } from "@/app/(panel)/dashboard/configurations/model/_actions/update-model";
 * const result = await updateModel({ trade_name: "Barbearia do João", name: "João", cpf: "123.456.789-00", phone: "(11) 99999-9999" });
 */
'use server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isCPFValid } from '@/utils/formatCPF'
import { isCNPJValid } from '@/utils/formatCNPJ'

/** Schema de validacao com validacao completa de digitos verificadores de CPF/CNPJ */
const formSchema = z
	.object({
		/** Nome fantasia da empresa (opcional, max 100 caracteres) */
		trade_name: z
			.string()
			.max(100, { message: 'O nome fantasia deve ter no máximo 100 caracteres.' })
			.optional(),
		/** Nome do usuario ou empresa (obrigatorio) */
		name: z
			.string()
			.min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
			.max(100, { message: 'O nome deve ter no máximo 100 caracteres.' }),
		/** CNPJ (opcional, validado com digitos verificadores se fornecido) */
		cnpj: z.string().optional(),
		/** Telefone de contato (opcional) */
		phone: z.string().optional(),
		/** CPF (opcional, validado com digitos verificadores se fornecido) */
		cpf: z.string().optional(),
	})
	.refine(
		(data) => {
			// Validacao com digitos verificadores usando funcoes dos utils
			if (data.cnpj && data.cnpj.trim() !== '') {
				return isCNPJValid(data.cnpj)
			}
			if (data.cpf && data.cpf.trim() !== '') {
				return isCPFValid(data.cpf)
			}
			return true
		},
		{
			message: 'CPF ou CNPJ inválido.',
			path: ['cpf'],
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
 * @param formData - Dados do formulário de modelo (nome fantasia, nome, CPF/CNPJ, telefone)
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * // Pessoa Física
 * const result = await updateModel({
 *   trade_name: "Barbearia do João",
 *   name: "João Silva",
 *   cpf: "123.456.789-00",
 *   phone: "(11) 99999-9999"
 * });
 *
 * // Pessoa Jurídica
 * const result = await updateModel({
 *   trade_name: "Salão Beleza Pura",
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
				trade_name: formData.trade_name,
				name: formData.name,
				cnpj: formData.cnpj,
				phone: formData.phone,
				cpf: formData.cpf,
			},
		})
		revalidatePath('/dashboard', 'layout')
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
