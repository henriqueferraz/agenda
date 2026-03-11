/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Data Access: retorna a data do próximo agendamento (primeiro a partir de hoje) no timezone America/Sao_Paulo;
 * usado para inicializar o calendário público (SEM verificação de autenticação).
 *
 * @example
 * const nextDate = await getPublicNextAppointmentDate({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
import { getNowInSaoPaulo, startOfDayInSaoPaulo } from '@/utils/date-timezone'

interface GetPublicNextAppointmentDateProps {
	/** ID único do usuário (empresa) */
	userId: string
}

/**
 * Busca a data do próximo agendamento (versão pública, sem autenticação)
 *
 * Esta função é executada no servidor e busca o primeiro agendamento
 * a partir de hoje, retornando sua data. Usado para inicializar o
 * calendário na data correta. Todas as datas são tratadas no timezone
 * America/Sao_Paulo. NÃO requer autenticação (para uso em páginas públicas).
 *
 * @param props - Propriedades da consulta
 * @returns Data do próximo agendamento ou null se não houver
 *
 * @example
 * ```typescript
 * const nextDate = await getPublicNextAppointmentDate({ userId: "usr_123" });
 * if (nextDate) {
 *   console.log(nextDate); // Date("2024-01-15T14:00:00")
 * } else {
 *   console.log("Não há agendamentos futuros");
 * }
 * ```
 */
export const getPublicNextAppointmentDate = async ({
	userId,
}: GetPublicNextAppointmentDateProps) => {
	try {
		if (!userId) {
			console.warn('getPublicNextAppointmentDate: userId não fornecido')
			return null
		}

		// Cria data de hoje no timezone America/Sao_Paulo
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)

		// Busca o primeiro agendamento a partir de hoje
		const appointment = await prisma.appointment.findFirst({
			where: {
				userId: userId,
				appointmentDate: {
					gte: today,
				},
			},
			orderBy: {
				appointmentDate: 'asc',
			},
			select: {
				appointmentDate: true,
			},
		})

		if (appointment) {
			return appointment.appointmentDate
		}

		return null
	} catch (error) {
		console.error('Erro ao buscar próxima data de agendamento público:', {
			userId,
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
		})
		return null
	}
}
