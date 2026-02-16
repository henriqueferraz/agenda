/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza os horários de trabalho do funcionário por dia da semana. Valida employeeId
 * e horários (HH:MM) com Zod, verifica propriedade, ordena e remove duplicatas, persiste no Employee e revalida cache.
 *
 * @example
 * import { updateEmployeeTimes } from "@/app/(panel)/dashboard/services/employee/_actions/update-employee-times";
 * const result = await updateEmployeeTimes({ employeeId: "emp_123", mon_times: ["08:00"], tue_times: [], ... });
 */
'use server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
// Schema de validação para horários do funcionário
const formSchema = z.object({
	employeeId: z.string().min(1, 'ID do funcionário é obrigatório'),
	mon_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
	tue_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
	wed_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
	thu_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
	fri_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
	sat_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
	sun_times: z
		.array(
			z
				.string()
				.regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					'Horário deve estar no formato HH:MM',
				),
		)
		.optional(),
})
type FormSchema = z.infer<typeof formSchema>
/**
 * Atualiza os horários de trabalho do funcionário
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada (Zod)
 * 3. Verificação de propriedade (funcionário pertence ao usuário)
 * 4. Limpeza e ordenação dos horários (remove duplicatas, ordena cronologicamente)
 * 5. Atualização no banco de dados
 * 6. Revalidação do cache
 *
 * @param timesData - Dados dos horários por dia da semana
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * const result = await updateEmployeeTimes({
 *   employeeId: "emp_123",
 *   mon_times: ["08:00", "09:00", "10:00"],
 *   tue_times: ["08:00", "09:00"],
 *   wed_times: [],
 *   // ... outros dias
 * });
 *
 * if (result.success) {
 *   console.log(result.message); // "Horários atualizados com sucesso."
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export const updateEmployeeTimes = async (timesData: FormSchema) => {
	try {
		// Verifica autenticação do usuário
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Usuário não autenticado. Faça login novamente.',
			}
		}
		// Valida os dados de entrada usando Zod
		const schema = formSchema.safeParse(timesData)
		if (!schema.success) {
			const errorMessage =
				schema.error.issues[0]?.message ||
				'Dados inválidos. Verifique os horários informados.'
			return {
				success: false,
				error: errorMessage,
			}
		}
		// Verifica se o funcionário existe e pertence ao usuário
		const employee = await prisma.employee.findUnique({
			where: {
				id: timesData.employeeId,
			},
			select: {
				UserId: true,
			},
		})
		if (!employee) {
			return {
				success: false,
				error: 'Funcionário não encontrado.',
			}
		}
		if (employee.UserId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para atualizar este funcionário.',
			}
		}
		// Função para ordenar e remover duplicatas dos horários
		const cleanTimes = (times: string[] | undefined): string[] => {
			if (!times || times.length === 0) return []
			const uniqueTimes = Array.from(new Set(times))
			return uniqueTimes.sort((a, b) => {
				const [aHours, aMinutes] = a.split(':').map(Number)
				const [bHours, bMinutes] = b.split(':').map(Number)
				if (aHours !== bHours) {
					return aHours - bHours
				}
				return aMinutes - bMinutes
			})
		}
		// Limpa e ordena todos os horários
		const cleanedData = {
			mon_times: cleanTimes(timesData.mon_times),
			tue_times: cleanTimes(timesData.tue_times),
			wed_times: cleanTimes(timesData.wed_times),
			thu_times: cleanTimes(timesData.thu_times),
			fri_times: cleanTimes(timesData.fri_times),
			sat_times: cleanTimes(timesData.sat_times),
			sun_times: cleanTimes(timesData.sun_times),
		}
		// Atualiza os horários no banco de dados
		await prisma.employee.update({
			where: {
				id: timesData.employeeId,
			},
			data: cleanedData,
		})
		// Revalida o cache da página
		revalidatePath('/dashboard/services/employee')
		return {
			success: true,
			message: 'Horários atualizados com sucesso.',
		}
	} catch (error) {
		console.error('Erro ao atualizar horários do funcionário:', {
			userId: (await getUserFromToken())?.id,
			employeeId: timesData.employeeId,
			error: error instanceof Error ? error.message : error,
		})
		return {
			success: false,
			error: 'Erro interno do servidor. Tente novamente.',
		}
	}
}
