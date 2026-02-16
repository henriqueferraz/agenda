/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que atualiza os horários de funcionamento do usuário por dia da semana.
 * Valida autenticação e horários (HH:MM) com Zod, ordena e remove duplicatas, persiste no User.
 *
 * @example
 * import { updateTimes } from "@/app/(panel)/dashboard/configurations/time/_actions/update-times";
 * const result = await updateTimes({ mon_times: ["08:00", "09:00"], tue_times: [], ... });
 */
'use server'
import { getUserFromToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
// Schema de validação para horários
const formSchema = z.object({
	// Cada dia da semana é um array de strings (horários) - opcional
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
 * Atualiza os horários de funcionamento do usuário
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada
 * 3. Ordenação e limpeza dos horários
 * 4. Atualização no banco de dados
 * 5. Revalidação do cache das páginas
 *
 * @param timesData - Dados dos horários por dia da semana
 * @returns Objeto com resultado da operação
 *
 * @example
 * ```typescript
 * const result = await updateTimes({
 *   mon_times: ["08:00", "09:00", "10:00"],
 *   tue_times: ["08:00", "09:00"],
 *   wed_times: [], // fechado
 *   thu_times: ["14:00", "15:00"],
 *   fri_times: ["08:00", "09:00"],
 *   sat_times: ["10:00"],
 *   sun_times: [] // fechado
 * });
 *
 * if (result.error) {
 *   console.error(result.error);
 * } else {
 *   console.log(result.data); // "Horários atualizados com sucesso."
 * }
 * ```
 */
export const updateTimes = async (timesData: FormSchema) => {
	try {
		// Verifica autenticação do usuário
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				error: 'Usuário não autenticado. Faça login novamente.',
			}
		}
		// Valida os dados de entrada usando Zod
		const schema = formSchema.safeParse(timesData)
		if (!schema.success) {
			// Retorna primeira mensagem de erro encontrada
			const errorMessage =
				schema.error.issues[0]?.message ||
				'Dados inválidos. Verifique os horários informados.'
			return {
				error: errorMessage,
			}
		}
		// Função para ordenar e remover duplicatas dos horários
		const cleanTimes = (times: string[] | undefined): string[] => {
			if (!times || times.length === 0) return []
			// Remove duplicatas e ordena cronologicamente
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
		await prisma.user.update({
			where: {
				id: session.id,
			},
			data: cleanedData,
		})
		// Revalida o cache da página para refletir mudanças
		revalidatePath('/dashboard/configurations/time')
		return {
			data: 'Horários atualizados com sucesso.',
		}
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao atualizar horários:', {
			userId: (await getUserFromToken())?.id,
			timesData,
			error: error instanceof Error ? error.message : error,
		})
		return {
			error: 'Erro interno do servidor. Tente novamente.',
		}
	}
}
