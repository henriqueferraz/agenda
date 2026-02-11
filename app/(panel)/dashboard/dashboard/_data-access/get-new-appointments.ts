/**
 * Data Access: busca agendamentos criados após uma data (ou últimas 30h) para notificações no dashboard; valida que o userId corresponde ao usuário autenticado.
 *
 * @example
 * const newAppointments = await getNewAppointments({ userId: 'usr_123', lastCheckDate: new Date() });
 */
'use server'
import prisma from '@/lib/prisma'
import { getNowInSaoPaulo } from '@/utils/date-timezone'
import { getUserFromToken } from '@/lib/auth'
interface GetNewAppointmentsProps {
	/** ID único do usuário */
	userId: string
	/** Data da última verificação (opcional) */
	lastCheckDate?: Date
}
interface NewAppointment {
	id: string
	name: string
	email: string
	phone: string
	appointmentDate: Date
	time: string
	service: {
		id: string
		name: string
	}
	employee: {
		id: string
		name: string
	}
	createdAt: Date
}
/**
 * Data Access Layer - Novos Agendamentos
 *
 * Camada de acesso a dados responsável por buscar novos agendamentos criados
 * após uma data específica. Utilizado para notificações no dashboard.
 * Todas as datas são tratadas no timezone America/Sao_Paulo.
 *
 * ## Funcionalidades
 * -  Busca de agendamentos criados após uma data específica
 * -  Inclusão de informações de serviço e funcionário
 * -  Ordenação por data de criação (mais recentes primeiro)
 * -  Validação de parâmetros de entrada
 * -  Tratamento robusto de erros
 *
 * @param props - Propriedades da consulta
 * @returns Array de novos agendamentos ou array vazio em caso de erro
 *
 * @example
 * ```typescript
 * const newAppointments = await getNewAppointments({
 *   userId: "usr_123",
 *   lastCheckDate: new Date("2024-01-15T10:00:00")
 * });
 * console.log(newAppointments.length); // 3
 * ```
 */
export const getNewAppointments = async ({
	userId,
	lastCheckDate,
}: GetNewAppointmentsProps): Promise<NewAppointment[]> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			console.warn('getNewAppointments: usuario nao autenticado')
			return []
		}
		if (!userId) {
			console.warn('getNewAppointments: userId não fornecido')
			return []
		}
		if (session.id !== userId) {
			console.warn(
				'getNewAppointments: userId nao corresponde ao usuario autenticado',
			)
			return []
		}
		// Se não há data de última verificação, busca agendamentos das últimas 30 horas
		const now = getNowInSaoPaulo()
		const checkDate =
			lastCheckDate || new Date(now.getTime() - 30 * 60 * 60 * 1000)
		// Busca novos agendamentos criados após a data de verificação
		const newAppointments = await prisma.appointment.findMany({
			where: {
				userId: userId,
				createdAt: {
					gte: checkDate,
				},
			},
			include: {
				service: {
					select: {
						id: true,
						name: true,
					},
				},
				employee: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})
		return newAppointments.map((apt) => ({
			id: apt.id,
			name: apt.name,
			email: apt.email,
			phone: apt.phone,
			appointmentDate: apt.appointmentDate,
			time: apt.time,
			service: {
				id: apt.service.id,
				name: apt.service.name,
			},
			employee: {
				id: apt.employee.id,
				name: apt.employee.name,
			},
			createdAt: apt.createdAt,
		}))
	} catch (error) {
		console.error('Erro ao buscar novos agendamentos:', {
			userId,
			lastCheckDate,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
