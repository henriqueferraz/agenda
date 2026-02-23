/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Server action para criar um bloqueio de horário específico de um funcionário.
 * Valida employeeId, date, time, motivation e userId com Zod, verifica autenticação,
 * propriedade do funcionário e duplicidade, então persiste o bloqueio.
 *
 * @example
 * import { createBlockedTime } from "@/app/(panel)/dashboard/schedule/blocked-time/_actions/create-blocked-time"
 * const result = await createBlockedTime({
 *   date: new Date("2026-02-25"),
 *   time: "14:00",
 *   motivation: "Consulta médica",
 *   employeeId: "emp_123",
 *   userId: "usr_123",
 * })
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import {
	startOfDayInSaoPaulo,
	endOfDayInSaoPaulo,
} from '@/utils/date-timezone'

/** Schema Zod para validação dos dados de criação de bloqueio */
const createBlockedTimeSchema = z.object({
	date: z.date(),
	time: z
		.string()
		.regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM'),
	motivation: z
		.string()
		.min(3, 'Motivo deve ter pelo menos 3 caracteres')
		.max(500, 'Motivo deve ter no máximo 500 caracteres'),
	employeeId: z.string().min(1, 'ID do funcionário é obrigatório'),
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
})

/** Tipo inferido do schema de criação */
type CreateBlockedTimeData = z.infer<typeof createBlockedTimeSchema>

/** Resposta padronizada da server action */
interface ActionResponse {
	/** Indica se a operação foi bem-sucedida */
	success: boolean
	/** Mensagem de sucesso */
	message?: string
	/** Mensagem de erro */
	error?: string
	/** Dados retornados (registro criado) */
	data?: unknown
}

/**
 * Cria um bloqueio de horário para um funcionário específico em uma data e horário.
 * Impede que agendamentos sejam feitos naquele slot.
 *
 * @param data - Dados do bloqueio (date, time, motivation, employeeId, userId)
 * @returns ActionResponse com resultado da operação
 *
 * @example
 * ```typescript
 * const result = await createBlockedTime({
 *   date: new Date("2026-02-25"),
 *   time: "14:00",
 *   motivation: "Consulta médica",
 *   employeeId: "emp_123",
 *   userId: "usr_123",
 * })
 * if (result.success) {
 *   console.log(result.message) // "Bloqueio criado com sucesso!"
 * }
 * ```
 */
export const createBlockedTime = async (
	data: CreateBlockedTimeData,
): Promise<ActionResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}

		const validatedData = createBlockedTimeSchema.parse(data)

		if (validatedData.userId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para criar bloqueios nesta empresa.',
			}
		}

		const employee = await prisma.employee.findFirst({
			where: {
				id: validatedData.employeeId,
				UserId: session.id,
				deletedAt: null,
			},
		})
		if (!employee) {
			return {
				success: false,
				error: 'Funcionário não encontrado ou não pertence à sua empresa.',
			}
		}

		const normalizedDate = startOfDayInSaoPaulo(validatedData.date)
		const dayEnd = endOfDayInSaoPaulo(validatedData.date)

		const existingBlock = await prisma.blockedTime.findFirst({
			where: {
				employeeId: validatedData.employeeId,
				date: { gte: normalizedDate, lt: dayEnd },
				time: validatedData.time,
			},
		})
		if (existingBlock) {
			return {
				success: false,
				error: 'Já existe um bloqueio para este funcionário neste horário.',
			}
		}

		const confirmedAppointment = await prisma.appointment.findFirst({
			where: {
				employeeId: validatedData.employeeId,
				status: 'confirmed',
				appointmentDate: { gte: normalizedDate, lt: dayEnd },
				time: validatedData.time,
			},
		})
		if (confirmedAppointment) {
			return {
				success: false,
				error: 'Existe um agendamento confirmado neste horário. Cancele-o antes de criar o bloqueio.',
			}
		}

		const blockedTime = await prisma.blockedTime.create({
			data: {
				date: normalizedDate,
				time: validatedData.time,
				motivation: validatedData.motivation,
				employeeId: validatedData.employeeId,
				UserId: session.id,
			},
		})

		revalidatePath('/dashboard/schedule/blocked-time')

		return {
			success: true,
			message: 'Bloqueio criado com sucesso!',
			data: blockedTime,
		}
	} catch (error) {
		console.error('Erro ao criar bloqueio de horário:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || 'Dados inválidos',
			}
		}
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Erro ao criar bloqueio',
		}
	}
}
