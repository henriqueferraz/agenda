/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Core compartilhado de lógica de agendamentos (F-02).
 * Contém funções de cancelamento, reagendamento e edição reutilizáveis
 * por F-02 (profissional), F-07 (WhatsApp massa) e F-08 (autogestão do cliente).
 * As funções NÃO enviam notificações — cada chamador decide como/se notificar.
 *
 * @example
 * import { cancelAppointmentCore } from '@/app/_core/appointment-core'
 * const result = await cancelAppointmentCore({ appointmentId: 'apt_1', reason: 'Cliente não compareceu', cancelledBy: 'professional', userId: 'usr_1' })
 */
import prisma from '@/lib/prisma'
import type { Prisma } from '@/lib/generated/prisma/client'
import {
	endOfDayInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
	startOfDayInSaoPaulo,
	getNowInSaoPaulo,
} from '@/utils/date-timezone'

/** Resultado padronizado das operações core. */
interface CoreResult {
	/** Indica se a operação foi bem-sucedida. */
	success: boolean
	/** Mensagem de erro quando success === false. */
	error?: string
	/** Dados do agendamento atualizado quando success === true. */
	data?: Record<string, unknown>
}

/** Parâmetros para cancelamento de agendamento. */
interface CancelParams {
	/** ID do agendamento a cancelar. */
	appointmentId: string
	/** Motivo do cancelamento (opcional). */
	reason?: string
	/** Quem cancelou: 'professional', 'client' ou 'system'. */
	cancelledBy: string
	/** ID do usuário (empresa) dono do agendamento. */
	userId: string
}

/** Parâmetros para reagendamento. */
interface RescheduleParams {
	/** ID do agendamento a reagendar. */
	appointmentId: string
	/** Nova data do agendamento. */
	newDate: Date
	/** Novo horário no formato HH:MM. */
	newTime: string
	/** Quem reagendou: 'professional', 'client' ou 'system'. */
	performedBy: string
	/** ID do usuário (empresa) dono do agendamento. */
	userId: string
}

/** Parâmetros para edição de agendamento. */
interface UpdateParams {
	/** ID do agendamento a editar. */
	appointmentId: string
	/** Dados a atualizar (campos opcionais). */
	data: {
		/** Novo ID do serviço. */
		serviceId?: string
		/** Novo ID do funcionário. */
		employeeId?: string
		/** Nova data do agendamento. */
		appointmentDate?: Date
		/** Novo horário no formato HH:MM. */
		time?: string
	}
	/** Quem editou: 'professional', 'client' ou 'system'. */
	performedBy: string
	/** ID do usuário (empresa) dono do agendamento. */
	userId: string
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
 * Verifica se existe sobreposição entre um novo intervalo e agendamentos existentes.
 * Exclui opcionalmente um appointmentId da verificação (para não conflitar consigo mesmo).
 * @param appointments - agendamentos existentes com time, appointmentDate, service.duration e id
 * @param newStart - início do novo agendamento (Date no timezone SP)
 * @param newEnd - fim do novo agendamento (Date = início + duração do serviço)
 * @param excludeId - ID do agendamento a excluir da verificação (opcional)
 * @returns true se há sobreposição com pelo menos um agendamento existente
 */
const hasTimeOverlap = (
	appointments: Array<{
		id: string
		time: string
		appointmentDate: Date
		service: { duration: number }
	}>,
	newStart: Date,
	newEnd: Date,
	excludeId?: string,
): boolean =>
	appointments
		.filter((a) => a.id !== excludeId)
		.some((appointment) => {
			const [existingHours, existingMinutes] = appointment.time
				.split(':')
				.map(Number)
			const components = getDateComponentsInSaoPaulo(
				appointment.appointmentDate,
			)
			const existingStart = createDateInSaoPaulo(
				components.year,
				components.month,
				components.day,
				existingHours,
				existingMinutes,
				0,
				0,
			)
			const existingEnd = addMinutes(
				existingStart,
				appointment.service.duration,
			)
			return newStart < existingEnd && existingStart < newEnd
		})

/**
 * Cancela um agendamento existente. Valida propriedade e status,
 * atualiza para 'cancelled' e registra no AppointmentHistory.
 * Executado dentro de $transaction para atomicidade.
 *
 * @param params - appointmentId, reason, cancelledBy, userId
 * @returns CoreResult com dados do agendamento cancelado ou erro
 *
 * @example
 * const result = await cancelAppointmentCore({
 *   appointmentId: 'apt_1',
 *   reason: 'Cliente não pode comparecer',
 *   cancelledBy: 'professional',
 *   userId: 'usr_1',
 * })
 */
export const cancelAppointmentCore = async (
	params: CancelParams,
): Promise<CoreResult> => {
	const { appointmentId, reason, cancelledBy, userId } = params

	const result = await prisma.$transaction(async (tx) => {
		const appointment = await tx.appointment.findFirst({
			where: { id: appointmentId, userId },
			include: { service: true, employee: true },
		})

		if (!appointment) {
			return { success: false as const, error: 'Agendamento não encontrado.' }
		}

		if (appointment.status === 'cancelled') {
			return {
				success: false as const,
				error: 'Este agendamento já foi cancelado.',
			}
		}

		const now = getNowInSaoPaulo()
		const updated = await tx.appointment.update({
			where: { id: appointmentId },
			data: {
				status: 'cancelled',
				cancelReason: reason ?? null,
				cancelledAt: now,
				cancelledBy,
			},
			include: { service: true, employee: true },
		})

		await tx.appointmentHistory.create({
			data: {
				appointmentId,
				action: 'cancelled',
				performedBy: cancelledBy,
				reason: reason ?? null,
			},
		})

		return { success: true as const, data: updated }
	})

	if (!result.success) {
		return { success: false, error: result.error }
	}

	return {
		success: true,
		data: result.data as unknown as Record<string, unknown>,
	}
}

/**
 * Reagenda um agendamento existente para nova data/hora.
 * Valida propriedade, status, conflitos F-01 (funcionário e cliente) e data futura.
 * Exclui o próprio agendamento da validação de conflitos.
 * Executado dentro de $transaction para atomicidade.
 *
 * @param params - appointmentId, newDate, newTime, performedBy, userId
 * @returns CoreResult com dados do agendamento reagendado ou erro
 *
 * @example
 * const result = await rescheduleAppointmentCore({
 *   appointmentId: 'apt_1',
 *   newDate: new Date('2026-02-20'),
 *   newTime: '14:00',
 *   performedBy: 'professional',
 *   userId: 'usr_1',
 * })
 */
export const rescheduleAppointmentCore = async (
	params: RescheduleParams,
): Promise<CoreResult> => {
	const { appointmentId, newDate, newTime, performedBy, userId } = params

	const result = await prisma.$transaction(async (tx) => {
		const appointment = await tx.appointment.findFirst({
			where: { id: appointmentId, userId },
			include: { service: true, employee: true },
		})

		if (!appointment) {
			return { success: false as const, error: 'Agendamento não encontrado.' }
		}

		if (appointment.status === 'cancelled') {
			return {
				success: false as const,
				error: 'Não é possível reagendar um agendamento cancelado.',
			}
		}

		const now = getNowInSaoPaulo()
		const dateComponents = getDateComponentsInSaoPaulo(newDate)
		const [hours, minutes] = newTime.split(':').map(Number)
		const newDateTime = createDateInSaoPaulo(
			dateComponents.year,
			dateComponents.month,
			dateComponents.day,
			hours,
			minutes,
			0,
			0,
		)

		if (newDateTime < now) {
			return {
				success: false as const,
				error: 'Não é possível reagendar para data/hora passada.',
			}
		}

		const normalizedDate = startOfDayInSaoPaulo(newDate)
		const endOfDay = endOfDayInSaoPaulo(newDate)

		const stopDay = await tx.stopDay.findFirst({
			where: {
				UserId: userId,
				date: { gte: normalizedDate, lt: endOfDay },
			},
		})

		if (stopDay) {
			return {
				success: false as const,
				error: `Não é possível reagendar para este dia. Motivo: ${stopDay.motivation}`,
			}
		}

		const newStart = newDateTime
		const newEnd = addMinutes(newDateTime, appointment.service.duration)

		const employeeAppointments = await tx.appointment.findMany({
			where: {
				employeeId: appointment.employeeId,
				status: 'confirmed',
				appointmentDate: { gte: normalizedDate, lte: endOfDay },
			},
			include: { service: true },
		})

		if (
			hasTimeOverlap(employeeAppointments, newStart, newEnd, appointmentId)
		) {
			return {
				success: false as const,
				error:
					'Este funcionário já tem um agendamento neste horário.',
			}
		}

		const clientAppointments = await tx.appointment.findMany({
			where: {
				email: appointment.email.toLowerCase(),
				status: 'confirmed',
				appointmentDate: { gte: normalizedDate, lte: endOfDay },
			},
			include: { service: true },
		})

		if (hasTimeOverlap(clientAppointments, newStart, newEnd, appointmentId)) {
			return {
				success: false as const,
				error:
					'Este cliente já possui um agendamento que conflita com este horário.',
			}
		}

		const oldDate = appointment.appointmentDate.toISOString()
		const oldTime = appointment.time

		const updated = await tx.appointment.update({
			where: { id: appointmentId },
			data: {
				appointmentDate: normalizedDate,
				time: newTime,
			},
			include: { service: true, employee: true },
		})

		await tx.appointmentHistory.create({
			data: {
				appointmentId,
				action: 'rescheduled',
				performedBy,
				changes: {
					date: { from: oldDate, to: normalizedDate.toISOString() },
					time: { from: oldTime, to: newTime },
				},
			},
		})

		return { success: true as const, data: updated }
	})

	if (!result.success) {
		return { success: false, error: result.error }
	}

	return {
		success: true,
		data: result.data as unknown as Record<string, unknown>,
	}
}

/**
 * Edita um agendamento existente (serviço, funcionário, data, horário).
 * Valida propriedade, status, existência dos novos recursos, conflitos F-01
 * e registra todas as alterações no AppointmentHistory.
 * Executado dentro de $transaction para atomicidade.
 *
 * @param params - appointmentId, data (campos a editar), performedBy, userId
 * @returns CoreResult com dados do agendamento editado ou erro
 *
 * @example
 * const result = await updateAppointmentCore({
 *   appointmentId: 'apt_1',
 *   data: { serviceId: 'srv_2', time: '15:00' },
 *   performedBy: 'professional',
 *   userId: 'usr_1',
 * })
 */
export const updateAppointmentCore = async (
	params: UpdateParams,
): Promise<CoreResult> => {
	const { appointmentId, data, performedBy, userId } = params

	const result = await prisma.$transaction(async (tx) => {
		const appointment = await tx.appointment.findFirst({
			where: { id: appointmentId, userId },
			include: { service: true, employee: true },
		})

		if (!appointment) {
			return { success: false as const, error: 'Agendamento não encontrado.' }
		}

		if (appointment.status === 'cancelled') {
			return {
				success: false as const,
				error: 'Não é possível editar um agendamento cancelado.',
			}
		}

		const changes: Record<string, { from: unknown; to: unknown }> = {}
		const updateData: Record<string, unknown> = {}

		let finalServiceId = appointment.serviceId
		let finalEmployeeId = appointment.employeeId
		let finalDate = appointment.appointmentDate
		let finalTime = appointment.time

		if (data.serviceId && data.serviceId !== appointment.serviceId) {
			const newService = await tx.service.findFirst({
				where: { id: data.serviceId, UserId: userId, status: true },
			})
			if (!newService) {
				return {
					success: false as const,
					error: 'Serviço não encontrado ou inativo.',
				}
			}
			changes.serviceId = {
				from: appointment.serviceId,
				to: data.serviceId,
			}
			updateData.serviceId = data.serviceId
			finalServiceId = data.serviceId
		}

		if (data.employeeId && data.employeeId !== appointment.employeeId) {
			const targetServiceId = finalServiceId
			const newEmployee = await tx.employee.findFirst({
				where: { id: data.employeeId, UserId: userId, status: true },
				include: {
					services: { where: { serviceId: targetServiceId } },
				},
			})
			if (!newEmployee) {
				return {
					success: false as const,
					error: 'Funcionário não encontrado ou inativo.',
				}
			}
			if (newEmployee.services.length === 0) {
				return {
					success: false as const,
					error: 'Este funcionário não realiza o serviço selecionado.',
				}
			}
			changes.employeeId = {
				from: appointment.employeeId,
				to: data.employeeId,
			}
			updateData.employeeId = data.employeeId
			finalEmployeeId = data.employeeId
		}

		if (data.appointmentDate) {
			const normalizedNew = startOfDayInSaoPaulo(data.appointmentDate)
			const normalizedOld = startOfDayInSaoPaulo(appointment.appointmentDate)
			if (normalizedNew.getTime() !== normalizedOld.getTime()) {
				changes.appointmentDate = {
					from: appointment.appointmentDate.toISOString(),
					to: normalizedNew.toISOString(),
				}
				updateData.appointmentDate = normalizedNew
				finalDate = normalizedNew
			}
		}

		if (data.time && data.time !== appointment.time) {
			changes.time = { from: appointment.time, to: data.time }
			updateData.time = data.time
			finalTime = data.time
		}

		if (Object.keys(changes).length === 0) {
			return {
				success: false as const,
				error: 'Nenhuma alteração detectada.',
			}
		}

		const needsConflictCheck =
			'appointmentDate' in changes ||
			'time' in changes ||
			'employeeId' in changes ||
			'serviceId' in changes

		if (needsConflictCheck) {
			const service = await tx.service.findFirst({
				where: { id: finalServiceId },
			})

			if (!service) {
				return {
					success: false as const,
					error: 'Serviço não encontrado.',
				}
			}

			const now = getNowInSaoPaulo()
			const dateComponents = getDateComponentsInSaoPaulo(finalDate)
			const [hours, minutes] = finalTime.split(':').map(Number)
			const dateTime = createDateInSaoPaulo(
				dateComponents.year,
				dateComponents.month,
				dateComponents.day,
				hours,
				minutes,
				0,
				0,
			)

			if (dateTime < now) {
				return {
					success: false as const,
					error: 'Não é possível agendar em data/hora passada.',
				}
			}

			const normalizedDate = startOfDayInSaoPaulo(finalDate)
			const endOfDay = endOfDayInSaoPaulo(finalDate)

			const stopDay = await tx.stopDay.findFirst({
				where: {
					UserId: userId,
					date: { gte: normalizedDate, lt: endOfDay },
				},
			})

			if (stopDay) {
				return {
					success: false as const,
					error: `Não é possível agendar neste dia. Motivo: ${stopDay.motivation}`,
				}
			}

			const newStart = dateTime
			const newEnd = addMinutes(dateTime, service.duration)

			const employeeAppointments = await tx.appointment.findMany({
				where: {
					employeeId: finalEmployeeId,
					status: 'confirmed',
					appointmentDate: { gte: normalizedDate, lte: endOfDay },
				},
				include: { service: true },
			})

			if (
				hasTimeOverlap(
					employeeAppointments,
					newStart,
					newEnd,
					appointmentId,
				)
			) {
				return {
					success: false as const,
					error:
						'Este funcionário já tem um agendamento neste horário.',
				}
			}

			const clientAppointments = await tx.appointment.findMany({
				where: {
					email: appointment.email.toLowerCase(),
					status: 'confirmed',
					appointmentDate: { gte: normalizedDate, lte: endOfDay },
				},
				include: { service: true },
			})

			if (
				hasTimeOverlap(clientAppointments, newStart, newEnd, appointmentId)
			) {
				return {
					success: false as const,
					error:
						'Este cliente já possui um agendamento que conflita com este horário.',
				}
			}
		}

		const updated = await tx.appointment.update({
			where: { id: appointmentId },
			data: updateData,
			include: { service: true, employee: true },
		})

		await tx.appointmentHistory.create({
			data: {
				appointmentId,
				action: 'edited',
				performedBy,
				changes: changes as unknown as Prisma.InputJsonValue,
			},
		})

		return { success: true as const, data: updated }
	})

	if (!result.success) {
		return { success: false, error: result.error }
	}

	return {
		success: true,
		data: result.data as unknown as Record<string, unknown>,
	}
}
