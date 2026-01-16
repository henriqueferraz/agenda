/**
 * Server Action - Create Service
 *
 * Visao geral:
 * - Action server-side para Create Service.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/service/_actions/create-service";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Tipo de resposta das ações
type ActionResponse = {
	success: boolean
	data?: string | object
	message?: string
	error?: string
}
// Schema de validação para criação de serviço
const createServiceSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres')
		.regex(
			/^[a-zA-ZÀ-ÿ0-9\s\-]+$/,
			'Nome deve conter apenas letras, números, espaços e hífens',
		),
	price: z
		.number()
		.min(1, 'Preço deve ser maior que zero')
		.max(1000000, 'Preço máximo é R$ 10.000,00')
		.int('Preço deve ser um número inteiro (em centavos)'),
	duration: z
		.number()
		.min(1, 'Duração deve ser pelo menos 1 minuto')
		.max(480, 'Duração máxima é 480 minutos (8 horas)')
		.int('Duração deve ser um número inteiro (em minutos)'),
})
type CreateServiceData = z.infer<typeof createServiceSchema>
/**
 * Cria um novo serviço para o usuário autenticado
 *
 * Esta função realiza todas as validações necessárias e cria um serviço
 * no banco de dados com os dados fornecidos. Inclui verificação de autenticação,
 * validação de dados e tratamento de erros.
 *
 * @param data - Dados do serviço a ser criado
 * @returns Promise<ActionResponse> - Resposta de sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await createService({
 *   name: "Corte de Cabelo",
 *   price: 3000, // R$ 30,00 em centavos
 *   duration: 30  // 30 minutos
 * });
 *
 * if (result.success) {
 *   console.log("Serviço criado:", result.data);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const createService = async (
	data: CreateServiceData,
): Promise<ActionResponse> => {
	let session
	try {
		// Verificação de autenticação
		session = await getUserFromToken()
		if (!session?.id) {
			console.warn('createService: Usuário não autenticado')
			redirect('/')
		}
		// Validação dos dados de entrada
		const validatedData = createServiceSchema.parse(data)
		// Criar o serviço no banco de dados
		// Nota: price já vem em centavos e duration já vem em minutos
		// A conversão é feita no componente antes de chamar esta função
		const service = await prisma.service.create({
			data: {
				name: validatedData.name,
				price: validatedData.price, // Valor em centavos (ex: 3000 = R$ 30,00)
				duration: validatedData.duration, // Valor em minutos (ex: 90 = 1h30min)
				status: true,
				UserId: session.id,
			},
			select: {
				id: true,
				name: true,
				price: true,
				duration: true,
				status: true,
				createdAt: true,
			},
		})
		// Revalidar cache da página de serviços
		revalidatePath('/dashboard/services/service')
		return {
			success: true,
			data: service,
			message: `Serviço ${service.name} criado com sucesso!`,
		}
	} catch (error) {
		// Tratamento de erros específicos do Zod
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((err) => err.message).join(', ')
			console.error('Erro de validação ao criar serviço:', {
				userId: session?.id,
				errors: error.issues,
			})
			return {
				success: false,
				error: `Dados inválidos: ${errorMessages}`,
			}
		}
		// Log de erro genérico
		console.error('Erro interno ao criar serviço:', {
			userId: session?.id,
			data,
			error: error instanceof Error ? error.message : error,
		})
		return {
			success: false,
			error: 'Erro interno do servidor. Tente novamente mais tarde.',
		}
	}
}
