/**
 * Server Action - Update Employee
 *
 * Visao geral:
 * - Action server-side para Update Employee.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/_actions/update-employee";
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
// Schema de validação para atualização de funcionário
const updateEmployeeSchema = z.object({
	id: z.string().min(1, 'ID do funcionário é obrigatório'),
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
	serviceIds: z.array(z.string()).default([]),
})
type UpdateEmployeeData = z.infer<typeof updateEmployeeSchema>
/**
 * Atualiza um funcionário existente
 *
 * Esta função realiza todas as validações necessárias e atualiza um funcionário
 * no banco de dados com os dados fornecidos. Inclui verificação de autenticação,
 * validação de dados, verificação de propriedade, verificação de conflitos e
 * tratamento de erros.
 *
 * @param data - Dados do funcionário a ser atualizado
 * @returns Promise<ActionResponse> - Resposta de sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await updateEmployee({
 *   id: "emp_123",
 *   name: "João Silva",
 *   email: "joao@email.com",
 *   phone: "(11) 99999-9999",
 *   function: "Barbeiro"
 * });
 *
 * if (result.success) {
 *   console.log("Funcionário atualizado:", result.data);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const updateEmployee = async (
	data: UpdateEmployeeData,
): Promise<ActionResponse> => {
	let session
	try {
		// Verificação de autenticação
		session = await getUserFromToken()
		if (!session?.id) {
			console.warn('updateEmployee: Usuário não autenticado')
			redirect('/')
		}
		// Validação dos dados de entrada
		const validatedData = updateEmployeeSchema.parse(data)
		// Verificar se o funcionário existe e pertence ao usuário
		const existingEmployee = await prisma.employee.findUnique({
			where: { id: validatedData.id },
			select: { id: true, name: true, email: true, UserId: true },
		})
		if (!existingEmployee) {
			console.warn(
				`updateEmployee: Funcionário não encontrado - ${validatedData.id}`,
			)
			return {
				success: false,
				error: 'Funcionário não encontrado',
			}
		}
		// Verificar se o funcionário pertence ao usuário autenticado
		if (existingEmployee.UserId !== session.id) {
			console.warn(
				`updateEmployee: Funcionário não pertence ao usuário - ${validatedData.id}`,
			)
			return {
				success: false,
				error: 'Você não tem permissão para editar este funcionário',
			}
		}
		// Verificar se o email foi alterado e se já existe para outro funcionário
		if (validatedData.email !== existingEmployee.email) {
			const emailExists = await prisma.employee.findUnique({
				where: { email: validatedData.email },
			})
			if (emailExists) {
				console.warn(
					`updateEmployee: Email já cadastrado - ${validatedData.email}`,
				)
				return {
					success: false,
					error: 'Este email já está cadastrado para outro funcionário',
				}
			}
		}
		// Primeiro, remover todos os serviços existentes do funcionário
		await prisma.employeeService.deleteMany({
			where: { employeeId: validatedData.id },
		})
		// Depois, criar os novos relacionamentos com os serviços selecionados
		if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
			await prisma.employeeService.createMany({
				data: validatedData.serviceIds.map((serviceId) => ({
					employeeId: validatedData.id,
					serviceId: serviceId,
				})),
			})
		}
		// Atualizar o funcionário no banco de dados
		const employee = await prisma.employee.update({
			where: { id: validatedData.id },
			data: {
				name: validatedData.name,
				email: validatedData.email,
				phone: validatedData.phone,
				function: validatedData.function,
				updatedAt: new Date(),
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
		// Log de sucesso
		console.log('Funcionário atualizado com sucesso:', {
			employeeId: employee.id,
			userId: session?.id,
			name: employee.name,
			email: employee.email,
		})
		return {
			success: true,
			data: employee,
			message: `Funcionário ${employee.name} atualizado com sucesso!`,
		}
	} catch (error) {
		// Tratamento de erros específicos do Zod
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((err) => err.message).join(', ')
			console.error('Erro de validação ao atualizar funcionário:', {
				userId: session?.id,
				errors: error.issues,
			})
			return {
				success: false,
				error: `Dados inválidos: ${errorMessages}`,
			}
		}
		// Log de erro genérico
		console.error('Erro interno ao atualizar funcionário:', {
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
