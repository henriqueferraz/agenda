/**
 * Server action que cria um novo funcionário para o usuário autenticado. Valida nome, email, telefone,
 * função e serviceIds com Zod, verifica unicidade de email, persiste em Employee com serviços (many-to-many) e revalida cache.
 *
 * @example
 * import { createEmployee } from "@/app/(panel)/dashboard/services/employee/_actions/create-employee";
 * const result = await createEmployee({ name: "João", email: "j@x.com", phone: "11999999999", function: "Barbeiro", serviceIds: ["srv_1"] });
 */
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
// Tipo de resposta das ações
type ActionResponse = {
	success: boolean
	data?: string | object
	message?: string
	error?: string
}
// Schema de validação para criação de funcionário
const createEmployeeSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres')
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
	email: z
		.string()
		.email('Email deve ter um formato válido')
		.max(255, 'Email deve ter no máximo 255 caracteres'),
	phone: z
		.string()
		.min(10, 'Telefone deve ter pelo menos 10 dígitos')
		.max(15, 'Telefone deve ter no máximo 15 caracteres')
		.regex(
			/^[\d\s\-\+\(\)]+$/,
			'Telefone deve conter apenas números, espaços e caracteres de formatação',
		),
	function: z
		.string()
		.min(2, 'Função deve ter pelo menos 2 caracteres')
		.max(100, 'Função deve ter no máximo 100 caracteres')
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Função deve conter apenas letras e espaços'),
	serviceIds: z.array(z.string()).optional().default([]),
})
type CreateEmployeeData = z.infer<typeof createEmployeeSchema>
/**
 * Cria um novo funcionário para o usuário autenticado
 *
 * Esta função realiza todas as validações necessárias e cria um funcionário
 * no banco de dados com os dados fornecidos. Inclui verificação de autenticação,
 * validação de dados, verificação de conflitos e tratamento de erros.
 *
 * @param data - Dados do funcionário a ser criado
 * @returns Promise<ActionResponse> - Resposta de sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await createEmployee({
 *   name: "João Silva",
 *   email: "joao@email.com",
 *   phone: "(11) 99999-9999",
 *   function: "Barbeiro"
 * });
 *
 * if (result.success) {
 *   console.log("Funcionário criado:", result.data);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const createEmployee = async (
	data: CreateEmployeeData,
): Promise<ActionResponse> => {
	let session
	try {
		// Verificação de autenticação
		session = await getUserFromToken()
		if (!session?.id) {
			console.warn('createEmployee: Usuário não autenticado')
			redirect('/')
		}
		// Validação dos dados de entrada
		const validatedData = createEmployeeSchema.parse(data)
		// Verificar se o email já existe
		const existingEmployee = await prisma.employee.findUnique({
			where: { email: validatedData.email },
		})
		if (existingEmployee) {
			console.warn(
				`createEmployee: Email já cadastrado - ${validatedData.email}`,
			)
			return {
				success: false,
				error: 'Este email já está cadastrado para outro funcionário',
			}
		}
		// Criar o funcionário no banco de dados com serviços relacionados (many-to-many)
		const employee = await prisma.employee.create({
			data: {
				id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				name: validatedData.name,
				email: validatedData.email,
				phone: validatedData.phone,
				function: validatedData.function,
				status: true,
				UserId: session.id,
				updatedAt: new Date(),
				// Conectar múltiplos serviços através da tabela intermediária
				services: {
					create: validatedData.serviceIds.map((serviceId) => ({
						serviceId: serviceId,
					})),
				},
			},
			include: {
				services: {
					include: {
						service: true,
					},
				},
			},
		})
		// Revalidar cache da página de funcionários
		revalidatePath('/dashboard/services/employee')
		return {
			success: true,
			data: employee,
			message: `Funcionário ${employee.name} criado com sucesso!`,
		}
	} catch (error) {
		// Tratamento de erros específicos do Zod
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((err) => err.message).join(', ')
			console.error('Erro de validação ao criar funcionário:', {
				userId: session?.id,
				errors: error.issues,
			})
			return {
				success: false,
				error: `Dados inválidos: ${errorMessages}`,
			}
		}
		// Tratamento de erro de email único (caso não seja capturado acima)
		if (error instanceof Error && error.message.includes('Unique constraint')) {
			console.warn('createEmployee: Conflito de email único')
			return {
				success: false,
				error: 'Este email já está cadastrado para outro funcionário',
			}
		}
		// Log de erro genérico
		console.error('Erro interno ao criar funcionário:', {
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
