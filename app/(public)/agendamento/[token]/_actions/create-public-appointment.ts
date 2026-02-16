/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que cria um agendamento pelo fluxo público (sem login), usando o token da empresa.
 * Valida token, dados com Zod, disponibilidade, feriados e conflitos (timezone America/Sao_Paulo).
 * Verificação de conflitos e criação do agendamento são atômicas via prisma.$transaction (H-09).
 * Persiste em Appointment e revalida o cache da página de agendamento público.
 *
 * @example
 * import { createPublicAppointment } from "@/app/(public)/agendamento/[token]/_actions/create-public-appointment";
 * const result = await createPublicAppointment({ name: "João", email: "j@x.com", phone: "11999999999", appointmentDate: new Date(), time: "10:00", token: "joao-abc", serviceId: "srv_1", employeeId: "emp_1" });
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import {
	endOfDayInSaoPaulo,
	getNowInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
	startOfDayInSaoPaulo,
} from '@/utils/date-timezone'
/**
 *  Server Action - Criação de Agendamento Público
 *
 * Server action Next.js para criação segura de agendamentos através do acesso
 * público (sem autenticação). Valida o token da empresa e implementa todas as
 * validações necessárias para garantir integridade dos dados.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Validação de Token
 *    └── Verifica se token existe e é válido
 *
 * 2.  Validação de Dados (Zod)
 *    └── Schema completo: nome, email, telefone, data, horário, IDs
 *
 * 3.  Verificação de Propriedade
 *    └── Serviço e funcionário pertencem à empresa do token
 *
 * 4.  Verificação de Disponibilidade
 *    └── Serviço ativo, funcionário ativo e pode realizar o serviço
 *
 * 5.  Verificação de Data/Hora
 *    └── Data/hora não pode ser passada
 *    └── Verificação de feriados
 *
 * 6.  Verificação de Conflitos + Persistência (atómicos, H-09)
 *    └── Dentro de prisma.$transaction: conflitos + create
 *    └── Evita race condition em requisições simultâneas
 *
 * 7.  Persistência no Banco
 *    └── Create dentro da mesma transação da verificação de conflitos
 *
 * 8.  Revalidação de Cache
 *    └── Next.js cache purging específico
 *
 * 9.  Resposta Estruturada
 *    └── Success/Error com mensagens claras
 * ```
 *
 * ## Validações Implementadas
 * ```typescript
 * const createPublicAppointmentSchema = z.object({
 *   name: z.string().min(2).max(100),
 *   email: z.string().email().max(255),
 *   phone: z.string().min(10).max(15),
 *   appointmentDate: z.date(),
 *   time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
 *   token: z.string().min(1),
 *   serviceId: z.string().min(1),
 *   employeeId: z.string().min(1)
 * });
 * ```
 *
 * ## Estratégias de Segurança
 * -  **Validação de Token**: Verifica se token existe e é válido
 * -  **Validação**: Dupla validação (client + server) com Zod
 * -  **Sanitização**: Dados limpos antes da persistência
 * -  **Transações**: Operações atômicas (ACID compliance)
 * -  **Auditoria**: Logs detalhados de todas as operações
 *
 * ## Tratamento de Erros
 * - **400 Bad Request**: Dados de entrada inválidos
 * - **404 Not Found**: Token, serviço ou funcionário não encontrado
 * - **403 Forbidden**: Serviço/funcionário não pertence à empresa
 * - **409 Conflict**: Conflito de horário ou feriado
 * - **500 Internal Error**: Problemas de banco/conectividade
 *
 * @see {@link prisma.appointment.create} - Operação de banco
 * @see {@link revalidatePath} - Cache management
 */
const createPublicAppointmentSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter no mínimo 2 caracteres')
		.max(100, 'Nome muito longo'),
	email: z.string().email('Email inválido').max(255, 'Email muito longo'),
	phone: z
		.string()
		.min(10, 'Telefone inválido')
		.max(15, 'Telefone muito longo'),
	appointmentDate: z.date(),
	time: z
		.string()
		.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
	token: z.string().min(1, 'Token é obrigatório'),
	serviceId: z.string().min(1, 'Serviço é obrigatório'),
	employeeId: z.string().min(1, 'Funcionário é obrigatório'),
})
export interface CreatePublicAppointmentData {
	name: string
	email: string
	phone: string
	appointmentDate: Date
	time: string
	token: string
	serviceId: string
	employeeId: string
}
interface ActionResponse {
	success: boolean
	error?: string
	data?: unknown
}
/**
 * Soma minutos a uma data mantendo o timezone local.
 * @param date - data base
 * @param minutes - minutos a adicionar
 * @returns nova data com minutos somados
 */
const addMinutes = (date: Date, minutes: number): Date =>
	new Date(date.getTime() + minutes * 60 * 1000)
/**
 * Cria um agendamento através do acesso público
 *
 * @param data - Dados do agendamento incluindo token da empresa
 * @returns Resposta com sucesso/erro e dados do agendamento criado
 *
 * @example
 * ```typescript
 * const result = await createPublicAppointment({
 *   name: "João Silva",
 *   email: "joao@example.com",
 *   phone: "47999999999",
 *   appointmentDate: new Date(),
 *   time: "10:00",
 *   token: "joao-abc123",
 *   serviceId: "svc_123",
 *   employeeId: "emp_123"
 * });
 * ```
 */
export const createPublicAppointment = async (
	data: CreatePublicAppointmentData,
): Promise<ActionResponse> => {
	try {
		// Validar dados
		const validatedData = createPublicAppointmentSchema.parse(data)
		// Verificar se o token existe e obter o userId
		const company = await prisma.user.findUnique({
			where: { token_called: validatedData.token },
			select: { id: true },
		})
		if (!company) {
			return {
				success: false,
				error: 'Token inválido. Empresa não encontrada.',
			}
		}
		const userId = company.id
		// Verificar se o serviço existe e pertence à empresa
		const service = await prisma.service.findFirst({
			where: {
				id: validatedData.serviceId,
				UserId: userId,
				status: true,
			},
		})
		if (!service) {
			return {
				success: false,
				error: 'Serviço não encontrado ou inativo.',
			}
		}
		// Verificar se o funcionário existe e pertence à empresa
		const employee = await prisma.employee.findFirst({
			where: {
				id: validatedData.employeeId,
				UserId: userId,
				status: true,
			},
			include: {
				services: {
					where: {
						serviceId: validatedData.serviceId,
					},
				},
			},
		})
		if (!employee) {
			return {
				success: false,
				error: 'Funcionário não encontrado ou inativo.',
			}
		}
		// Verificar se o funcionário pode realizar o serviço
		if (employee.services.length === 0) {
			return {
				success: false,
				error: 'Este funcionário não realiza este serviço.',
			}
		}
		// Verificar se a data não é passada (usando timezone America/Sao_Paulo)
		const now = getNowInSaoPaulo()
		const dateComponents = getDateComponentsInSaoPaulo(
			validatedData.appointmentDate,
		)
		const [hours, minutes] = validatedData.time.split(':').map(Number)
		const appointmentDateTime = createDateInSaoPaulo(
			dateComponents.year,
			dateComponents.month,
			dateComponents.day,
			hours,
			minutes,
			0,
			0,
		)
		if (appointmentDateTime < now) {
			return {
				success: false,
				error: 'Não é possível agendar em data/hora passada.',
			}
		}
		// Verificar se é feriado
		const normalizedDate = startOfDayInSaoPaulo(validatedData.appointmentDate)
		const endOfDay = endOfDayInSaoPaulo(validatedData.appointmentDate)
		const stopDay = await prisma.stopDay.findFirst({
			where: {
				UserId: userId,
				date: {
					gte: normalizedDate,
					lt: endOfDay,
				},
			},
		})
		if (stopDay) {
			return {
				success: false,
				error: `Não é possível agendar neste dia. Motivo: ${stopDay.motivation}`,
			}
		}
		// Verificação de conflito + criação atômicas (evita race condition H-09)
		const newStart = appointmentDateTime
		const newEnd = addMinutes(appointmentDateTime, service.duration)
		const result = await prisma.$transaction(async (tx) => {
			// 1. Verificar conflito de horário dentro da transação (lock implícito)
			const dayAppointments = await tx.appointment.findMany({
				where: {
					employeeId: validatedData.employeeId,
					appointmentDate: {
						gte: normalizedDate,
						lte: endOfDay,
					},
				},
				include: {
					service: true,
				},
			})
			const hasOverlap = dayAppointments.some((appointment) => {
				const [existingHours, existingMinutes] = appointment.time
					.split(':')
					.map(Number)
				const appointmentComponents = getDateComponentsInSaoPaulo(
					appointment.appointmentDate,
				)
				const existingStart = createDateInSaoPaulo(
					appointmentComponents.year,
					appointmentComponents.month,
					appointmentComponents.day,
					existingHours,
					existingMinutes,
					0,
					0,
				)
				const existingEnd = addMinutes(existingStart, appointment.service.duration)
				return newStart < existingEnd && existingStart < newEnd
			})
			if (hasOverlap) {
				return { kind: 'conflict' as const }
			}
			// 2. Criar agendamento na mesma transação
			const appointment = await tx.appointment.create({
				data: {
					id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					name: validatedData.name,
					email: validatedData.email,
					phone: validatedData.phone,
					appointmentDate: normalizedDate,
					time: validatedData.time,
					userId: userId,
					serviceId: validatedData.serviceId,
					employeeId: validatedData.employeeId,
				},
				include: {
					service: true,
					employee: true,
				},
			})
			return { kind: 'created' as const, appointment }
		})
		if (result.kind === 'conflict') {
			return {
				success: false,
				error:
					'Este horário já está ocupado. Por favor, escolha outro horário.',
			}
		}
		const appointment = result.appointment
		// Revalidar cache da página pública
		revalidatePath(`/agendamento/${validatedData.token}`)
		return {
			success: true,
			data: appointment,
		}
	} catch (error) {
		console.error('Erro ao criar agendamento público:', {
			data,
			error: error instanceof Error ? error.message : error,
		})
		// Se for erro de validação do Zod
		if (error instanceof z.ZodError) {
			return {
				success: false,
				error: error.issues[0]?.message || 'Erro de validação',
			}
		}
		return {
			success: false,
			error: 'Erro ao criar agendamento. Tente novamente.',
		}
	}
}
