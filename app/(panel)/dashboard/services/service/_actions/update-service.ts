/**
 * Server Action - Update Service
 *
 * Visao geral:
 * - Action server-side para Update Service.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/service/_actions/update-service";
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
// Schema de validação para atualização de serviço
const updateServiceSchema = z.object({
	id: z.string().min(1, 'ID do serviço é obrigatório'),
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
type UpdateServiceData = z.infer<typeof updateServiceSchema>
/**
 * Atualiza um serviço existente no banco de dados
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada (Zod)
 * 3. Verificação de propriedade (serviço pertence ao usuário)
 * 4. Atualização no banco de dados
 * 5. Revalidação do cache
 *
 * @param data - Dados do serviço a ser atualizado
 * @returns Promise<ActionResponse> - Resposta de sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await updateService({
 *   id: "srv_123",
 *   name: "Corte de Cabelo Premium",
 *   price: 5000, // R$ 50,00 em centavos
 *   duration: 45  // 45 minutos
 * });
 *
 * if (result.success) {
 *   console.log("Serviço atualizado:", result.data);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const updateService = async (
	data: UpdateServiceData,
): Promise<ActionResponse> => {
	let session
	try {
		// Verificação de autenticação
		session = await getUserFromToken()
		if (!session?.id) {
			console.warn('updateService: Usuário não autenticado')
			redirect('/')
		}
		// Validação dos dados de entrada
		const validatedData = updateServiceSchema.parse(data)
		// Verificar se o serviço existe e pertence ao usuário
		const existingService = await prisma.service.findUnique({
			where: { id: validatedData.id },
			select: { id: true, name: true, UserId: true },
		})
		if (!existingService) {
			console.warn(
				`updateService: Serviço não encontrado - ${validatedData.id}`,
			)
			return {
				success: false,
				error: 'Serviço não encontrado',
			}
		}
		// Verificar se o serviço pertence ao usuário autenticado
		if (existingService.UserId !== session.id) {
			console.warn(
				`updateService: Serviço não pertence ao usuário - ${validatedData.id}`,
			)
			return {
				success: false,
				error: 'Você não tem permissão para editar este serviço',
			}
		}
		// Atualizar o serviço no banco de dados
		// Nota: price já vem em centavos e duration já vem em minutos
		// A conversão é feita no componente antes de chamar esta função
		const service = await prisma.service.update({
			where: { id: validatedData.id },
			data: {
				name: validatedData.name,
				price: validatedData.price, // Valor em centavos (ex: 3000 = R$ 30,00)
				duration: validatedData.duration, // Valor em minutos (ex: 90 = 1h30min)
				updatedAt: new Date(),
			},
			select: {
				id: true,
				name: true,
				price: true,
				duration: true,
				status: true,
				updatedAt: true,
			},
		})
		// Revalidar cache da página de serviços
		revalidatePath('/dashboard/services/service')
		// Log de sucesso
		console.log('Serviço atualizado com sucesso:', {
			serviceId: service.id,
			userId: session?.id,
			name: service.name,
		})
		return {
			success: true,
			data: service,
			message: `Serviço ${service.name} atualizado com sucesso!`,
		}
	} catch (error) {
		// Tratamento de erros específicos do Zod
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((err) => err.message).join(', ')
			console.error('Erro de validação ao atualizar serviço:', {
				userId: session?.id,
				errors: error.issues,
			})
			return {
				success: false,
				error: `Dados inválidos: ${errorMessages}`,
			}
		}
		// Log de erro genérico
		console.error('Erro interno ao atualizar serviço:', {
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
