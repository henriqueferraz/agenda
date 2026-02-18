/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Data Access público (sem JWT) que busca horários disponíveis para reagendamento (F-08).
 * Calcula slots livres considerando horários da empresa, do funcionário,
 * agendamentos existentes confirmados e duração do serviço.
 *
 * @example
 * const times = await getAvailableTimesForReschedule({
 *   userId: 'usr_1', date: new Date(), employeeId: 'emp_1', serviceId: 'svc_1', excludeAppointmentId: 'apt_1'
 * })
 */
'use server'
import prisma from '@/lib/prisma'
import {
	startOfDayInSaoPaulo,
	endOfDayInSaoPaulo,
	getNowInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
} from '@/utils/date-timezone'

/** Parâmetros para busca de horários disponíveis. */
interface GetAvailableTimesProps {
	/** ID do usuário (empresa). */
	userId: string
	/** Data para verificar disponibilidade. */
	date: Date
	/** ID do funcionário. */
	employeeId: string
	/** ID do serviço (para calcular duração). */
	serviceId: string
	/** ID do agendamento atual (excluir da verificação de conflitos). */
	excludeAppointmentId: string
}

/** Mapa de dia da semana para chave de horários. */
const dayKeyMap: Record<number, string> = {
	0: 'sun_times',
	1: 'mon_times',
	2: 'tue_times',
	3: 'wed_times',
	4: 'thu_times',
	5: 'fri_times',
	6: 'sat_times',
}

/**
 * Busca horários disponíveis para reagendamento público (F-08).
 * Leva em conta: horários da empresa, horários do funcionário, agendamentos existentes
 * confirmados, duração do serviço e feriados.
 *
 * @param props - userId, date, employeeId, serviceId, excludeAppointmentId
 * @returns Array de horários disponíveis (strings HH:MM) ou array vazio
 *
 * @example
 * ```typescript
 * const times = await getAvailableTimesForReschedule({
 *   userId: 'usr_1',
 *   date: new Date('2026-02-20'),
 *   employeeId: 'emp_1',
 *   serviceId: 'svc_1',
 *   excludeAppointmentId: 'apt_1',
 * })
 * // Retorna: ['08:00', '08:30', '10:30', '11:00', ...]
 * ```
 */
export const getAvailableTimesForReschedule = async ({
	userId,
	date,
	employeeId,
	serviceId,
	excludeAppointmentId,
}: GetAvailableTimesProps): Promise<string[]> => {
	try {
		const normalizedDate = startOfDayInSaoPaulo(date)
		const endOfDay = endOfDayInSaoPaulo(date)

		const stopDay = await prisma.stopDay.findFirst({
			where: {
				UserId: userId,
				date: { gte: normalizedDate, lt: endOfDay },
			},
		})
		if (stopDay) return []

		const dateComponents = getDateComponentsInSaoPaulo(date)
		const jsDay = new Date(
			dateComponents.year,
			dateComponents.month - 1,
			dateComponents.day,
		).getDay()
		const dayKey = dayKeyMap[jsDay]

		const [company, employee, service] = await Promise.all([
			prisma.user.findUnique({
				where: { id: userId },
				select: {
					mon_times: true,
					tue_times: true,
					wed_times: true,
					thu_times: true,
					fri_times: true,
					sat_times: true,
					sun_times: true,
				},
			}),
			prisma.employee.findUnique({
				where: { id: employeeId },
				select: {
					mon_times: true,
					tue_times: true,
					wed_times: true,
					thu_times: true,
					fri_times: true,
					sat_times: true,
					sun_times: true,
				},
			}),
			prisma.service.findUnique({
				where: { id: serviceId },
				select: { duration: true },
			}),
		])

		if (!company || !employee || !service) return []

		const companyTimes = (company as Record<string, string[]>)[dayKey] ?? []
		const employeeTimes = (employee as Record<string, string[]>)[dayKey] ?? []

		if (companyTimes.length === 0 || employeeTimes.length === 0) return []

		const employeeTimeSet = new Set(employeeTimes)
		const baseTimes = companyTimes.filter((t) => employeeTimeSet.has(t))

		const existingAppointments = await prisma.appointment.findMany({
			where: {
				employeeId,
				status: 'confirmed',
				id: { not: excludeAppointmentId },
				appointmentDate: { gte: normalizedDate, lte: endOfDay },
			},
			include: { service: { select: { duration: true } } },
		})

		const occupied = new Set<string>()
		for (const apt of existingAppointments) {
			const [h, m] = apt.time.split(':').map(Number)
			const slots = Math.ceil(apt.service.duration / 30)
			let totalMin = h * 60 + m
			for (let i = 0; i < slots; i++) {
				const hh = String(Math.floor(totalMin / 60)).padStart(2, '0')
				const mm = String(totalMin % 60).padStart(2, '0')
				occupied.add(`${hh}:${mm}`)
				totalMin += 30
			}
		}

		const now = getNowInSaoPaulo()
		const nowComponents = getDateComponentsInSaoPaulo(now)
		const isToday =
			dateComponents.year === nowComponents.year &&
			dateComponents.month === nowComponents.month &&
			dateComponents.day === nowComponents.day

		const available = baseTimes.filter((time) => {
			if (occupied.has(time)) return false

			if (isToday) {
				const [h, m] = time.split(':').map(Number)
				const slotTime = createDateInSaoPaulo(
					dateComponents.year,
					dateComponents.month,
					dateComponents.day,
					h,
					m,
					0,
					0,
				)
				if (slotTime <= now) return false
			}

			const [h, m] = time.split(':').map(Number)
			const startMin = h * 60 + m
			const slotsNeeded = Math.ceil(service.duration / 30)
			for (let i = 1; i < slotsNeeded; i++) {
				const checkMin = startMin + i * 30
				const checkHH = String(Math.floor(checkMin / 60)).padStart(2, '0')
				const checkMM = String(checkMin % 60).padStart(2, '0')
				const checkTime = `${checkHH}:${checkMM}`
				if (occupied.has(checkTime)) return false
			}

			return true
		})

		return available
	} catch (error) {
		console.error('Erro ao buscar horários disponíveis para reagendamento:', {
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
