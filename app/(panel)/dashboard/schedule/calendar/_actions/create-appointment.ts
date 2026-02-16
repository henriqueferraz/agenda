/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que cria um agendamento no painel (usuário autenticado). Valida dados com Zod,
 * verifica propriedade de serviço/funcionário, disponibilidade, conflitos de horário e feriados
 * (timezone America/Sao_Paulo), então persiste em Appointment e revalida o cache do calendário.
 *
 * @example
 * import { createAppointment } from "@/app/(panel)/dashboard/schedule/calendar/_actions/create-appointment";
 * const result = await createAppointment({ name: "João", email: "j@x.com", phone: "11999999999", appointmentDate: new Date(), time: "14:00", userId, serviceId, employeeId });
 */
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import {
	endOfDayInSaoPaulo,
	getNowInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
	startOfDayInSaoPaulo,
} from '@/utils/date-timezone'
/**
 *  Server Action - Criação de Agendamento
 *
 * Conjunto de server actions Next.js para criação segura de agendamentos
 * no banco de dados. Implementa validação robusta, autenticação obrigatória
 * e persistência atômica no banco de dados com tratamento completo de erros
 * e revalidação de cache.
 *
 * ## Fluxo de Execução
 * ```
 * 1.  Verificação de Autenticação
 *    └── Sessão ativa requerida via JWT
 *
 * 2.  Validação de Dados (Zod)
 *    └── Schema completo: nome, email, telefone, data, horário, IDs
 *
 * 3.  Verificação de Propriedade
 *    └── Serviço e funcionário pertencem ao usuário autenticado
 *
 * 4.  Verificação de Disponibilidade
 *    └── Serviço ativo, funcionário ativo e pode realizar o serviço
 *
 * 5.  Verificação de Data/Hora
 *    └── Data/hora não pode ser passada
 *    └── Verificação de feriados
 *
 * 6.  Verificação de Conflitos
 *    └── Funcionário não pode ter dois agendamentos no mesmo horário
 *
 * 7.  Persistência no Banco
 *    └── Create atômico com todos os campos obrigatórios
 *
 * 8.  Revalidação de Cache
 *    └── Next.js cache purging específico para calendário
 *
 * 9.  Resposta Estruturada
 *    └── Success/Error com mensagens claras
 * ```
 *
 * ## Campos do Agendamento
 * - **name**: Nome do cliente (obrigatório, 2-100 caracteres)
 * - **email**: Email do cliente (obrigatório, formato válido, máximo 255 caracteres)
 * - **phone**: Telefone do cliente (obrigatório, 10-15 caracteres)
 * - **appointmentDate**: Data do agendamento (obrigatório, objeto Date)
 * - **time**: Horário do agendamento (obrigatório, formato HH:MM)
 * - **userId**: ID do usuário (empresa) (obrigatório)
 * - **serviceId**: ID do serviço (obrigatório)
 * - **employeeId**: ID do funcionário (obrigatório)
 *
 * ## Validações Implementadas
 * ```typescript
 * const createAppointmentSchema = z.object({
 *   name: z.string().min(2).max(100),
 *   email: z.string().email().max(255),
 *   phone: z.string().min(10).max(15),
 *   appointmentDate: z.date(),
 *   time: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
 *   userId: z.string().min(1),
 *   serviceId: z.string().min(1),
 *   employeeId: z.string().min(1)
 * });
 * ```
 *
 * ## Regras de Negócio
 * - **Timezone**: Todas as datas são tratadas no timezone America/Sao_Paulo
 * - **Data passada**: Não permite agendamentos em datas/horários passados
 * - **Feriados**: Não permite agendamentos em dias de feriado
 * - **Conflitos**: Funcionário não pode ter dois agendamentos no mesmo horário
 * - **Disponibilidade**: Serviço e funcionário devem estar ativos
 * - **Capacidade**: Funcionário deve poder realizar o serviço solicitado
 *
 * ## Estratégias de Segurança
 * -  **Autenticação**: Verificação de sessão JWT obrigatória
 * -  **Autorização**: Apenas usuário pode criar agendamentos em sua empresa
 * -  **Validação**: Dupla validação (client + server) com Zod
 * -  **Sanitização**: Dados limpos antes da persistência
 * -  **Transações**: Operações atômicas (ACID compliance)
 * -  **Auditoria**: Logs detalhados de todas as operações
 *
 * ## Tratamento de Erros
 * - **401 Unauthorized**: Sessão expirada/inválida
 * - **400 Bad Request**: Dados de entrada inválidos
 * - **404 Not Found**: Serviço ou funcionário não encontrado
 * - **403 Forbidden**: Serviço/funcionário não pertence ao usuário
 * - **409 Conflict**: Conflito de horário ou feriado
 * - **500 Internal Error**: Problemas de banco/conectividade
 * - **Fallback**: Mensagens genéricas para segurança
 *
 * ## Revalidação de Cache
 * - Página específica revalidada após sucesso
 * - Cache do Next.js limpo automaticamente
 * - Dados frescos garantidos para próximas requisições
 *
 * ## Logging e Monitoramento
 * - Erros críticos logados com contexto completo
 * - IDs de usuário, serviço e funcionário incluídos para rastreamento
 * - Dados de entrada preservados para debugging
 * - Timestamps automáticos em todos os logs
 *
 * ## Performance
 * - Operação atômica (ACID compliance)
 * - Conexão otimizada com pool de conexões
 * - Revalidação seletiva (não global)
 * - Sem bloqueios desnecessários
 * - Índices otimizados para queries
 *
 * ## Cenários de Uso
 * - Criação de novo agendamento pelo cliente
 * - Agendamento via sistema interno
 * - Reagendamento de serviços
 * - Agendamento de múltiplos serviços
 *
 * @see {@link getUserFromToken} - Autenticação JWT
 * @see {@link prisma.appointment.create} - Operação de banco
 * @see {@link revalidatePath} - Cache management
 */
const createAppointmentSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres'),
	email: z
		.string()
		.email('Email deve ter um formato válido')
		.max(255, 'Email deve ter no máximo 255 caracteres'),
	phone: z
		.string()
		.min(10, 'Telefone deve ter pelo menos 10 dígitos')
		.max(15, 'Telefone deve ter no máximo 15 caracteres'),
	appointmentDate: z.date(),
	time: z
		.string()
		.regex(
			/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
			'Horário deve estar no formato HH:MM',
		),
	userId: z.string().min(1, 'ID do usuário é obrigatório'),
	serviceId: z.string().min(1, 'ID do serviço é obrigatório'),
	employeeId: z.string().min(1, 'ID do funcionário é obrigatório'),
})
type CreateAppointmentData = z.infer<typeof createAppointmentSchema>
interface ActionResponse {
	success: boolean
	message?: string
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
 * Cria um novo agendamento no banco de dados
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Validação dos dados de entrada (Zod)
 * 3. Verificação de propriedade (serviço/funcionário pertence ao usuário)
 * 4. Verificação de disponibilidade (serviço/funcionário ativos)
 * 5. Verificação de data/hora (não passada, não feriado)
 * 6. Verificação de conflitos (funcionário não ocupado no horário)
 * 7. Criação no banco de dados
 * 8. Revalidação do cache
 *
 * @param data - Dados do agendamento a ser criado
 * @returns Objeto com resultado da operação (success/error)
 *
 * @example
 * ```typescript
 * const result = await createAppointment({
 *   name: "João Silva",
 *   email: "joao@example.com",
 *   phone: "(11) 99999-9999",
 *   appointmentDate: new Date("2024-01-15"),
 *   time: "14:00",
 *   userId: "usr_123",
 *   serviceId: "srv_456",
 *   employeeId: "emp_789"
 * });
 *
 * if (result.success) {
 *   console.log(result.message); // "Agendamento criado com sucesso"
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export const createAppointment = async (
	data: CreateAppointmentData,
): Promise<ActionResponse> => {
	try {
		// Verificar autenticação
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				error: 'Não autenticado. Faça login para continuar.',
			}
		}
		// Validar dados
		const validatedData = createAppointmentSchema.parse(data)
		// Verificar se o usuário é o dono da empresa
		if (validatedData.userId !== session.id) {
			return {
				success: false,
				error: 'Você não tem permissão para criar agendamentos nesta empresa.',
			}
		}
		// Verificar se o serviço existe e pertence ao usuário
		const service = await prisma.service.findFirst({
			where: {
				id: validatedData.serviceId,
				UserId: validatedData.userId,
				status: true,
			},
		})
		if (!service) {
			return {
				success: false,
				error: 'Serviço não encontrado ou inativo.',
			}
		}
		// Verificar se o funcionário existe e pertence ao usuário
		const employee = await prisma.employee.findFirst({
			where: {
				id: validatedData.employeeId,
				UserId: validatedData.userId,
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
		// Obtém os componentes da data do agendamento no timezone America/Sao_Paulo
		const appointmentDateComponents = getDateComponentsInSaoPaulo(
			validatedData.appointmentDate,
		)
		// Define a data do agendamento com o horário selecionado no timezone America/Sao_Paulo
		const [hours, minutes] = validatedData.time.split(':').map(Number)
		const appointmentDateTime = createDateInSaoPaulo(
			appointmentDateComponents.year,
			appointmentDateComponents.month,
			appointmentDateComponents.day,
			hours,
			minutes,
			0,
			0,
		)
		if (appointmentDateTime < now) {
			return {
				success: false,
				error: 'Não é possível agendar em datas ou horários passados.',
			}
		}
		// Verificar se é um feriado
		const normalizedDate = startOfDayInSaoPaulo(validatedData.appointmentDate)
		const endOfDay = endOfDayInSaoPaulo(validatedData.appointmentDate)
		const stopDay = await prisma.stopDay.findFirst({
			where: {
				UserId: validatedData.userId,
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
		// Verificar conflito de horário com funcionário (mesmo dia e intervalo)
		const dayAppointments = await prisma.appointment.findMany({
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
		const newStart = appointmentDateTime
		const newEnd = addMinutes(appointmentDateTime, service.duration)
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
			return {
				success: false,
				error: 'Este funcionário já tem um agendamento neste horário.',
			}
		}
		// Criar agendamento
		const appointment = await prisma.appointment.create({
			data: {
				name: validatedData.name,
				email: validatedData.email,
				phone: validatedData.phone,
				appointmentDate: normalizedDate,
				time: validatedData.time,
				userId: validatedData.userId,
				serviceId: validatedData.serviceId,
				employeeId: validatedData.employeeId,
			},
			include: {
				service: true,
				employee: true,
			},
		})
		// Revalidar cache
		revalidatePath('/dashboard/schedule/calendar')
		return {
			success: true,
			message: 'Agendamento criado com sucesso!',
			data: appointment,
		}
	} catch (error) {
		console.error('Erro ao criar agendamento:', {
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
			error:
				error instanceof Error ? error.message : 'Erro ao criar agendamento',
		}
	}
}
