/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-19
 * @version 2026.02.19
 * @projectVersion 0.9.0
 */
/**
 * API Route POST /api/cron/reminders — Motor de lembretes automáticos (F-03).
 * Chamada periodicamente pelo N8N (cron de 5 minutos). Busca agendamentos confirmados
 * nos próximos 7 dias, verifica as configurações de MessageConfig de cada profissional,
 * filtra por janela de envio (7d, 24h, 2h) e envia lembretes via sendGlobalMessage.
 * Registra cada envio no ReminderLog para evitar duplicatas (@@unique appointmentId+type).
 *
 * Segurança: valida header x-webhook-auth com WEBHOOK_AUTH_TOKEN.
 *
 * @example
 * // N8N faz POST a cada 5 minutos:
 * fetch('https://seusite.com/api/cron/reminders', {
 *   method: 'POST',
 *   headers: { 'x-webhook-auth': 'token-secreto' },
 * })
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendGlobalMessage } from '@/lib/global-messaging'
import type { GlobalMessageType } from '@/lib/global-messaging'
import { getDateComponentsInSaoPaulo, createDateInSaoPaulo } from '@/utils/date-timezone'

/** Janelas de envio: tipo do lembrete → milissegundos antes do agendamento. */
const REMINDER_WINDOWS: Record<string, { beforeMs: number; label: string; configKey: string }> = {
	reminder_7d: {
		beforeMs: 7 * 24 * 60 * 60 * 1000,
		label: '7 dias',
		configKey: 'reminder7d',
	},
	reminder_24h: {
		beforeMs: 24 * 60 * 60 * 1000,
		label: '24 horas',
		configKey: 'reminder24h',
	},
	reminder_2h: {
		beforeMs: 2 * 60 * 60 * 1000,
		label: '2 horas',
		configKey: 'reminder2h',
	},
}

/** Margem de tolerância para o cron de 5 minutos (10 min). */
const WINDOW_MARGIN_MS = 10 * 60 * 1000

/** URL base do app para construir managementLink. */
const getBaseUrl = (): string => {
	if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
	return 'http://localhost:3000'
}

/**
 * Converte appointmentDate (data SP armazenada como meia-noite UTC) + time (HH:MM SP)
 * em um Date UTC usando Intl.DateTimeFormat (suporta horário de verão automaticamente).
 *
 * @param appointmentDate - Data do agendamento (meia-noite UTC representando a data SP)
 * @param time - Hora do agendamento em formato "HH:MM" no timezone SP
 * @returns Date UTC correspondente ao momento real do agendamento
 */
const getAppointmentDateTime = (appointmentDate: Date, time: string): Date => {
	const dateStr = appointmentDate.toISOString().split('T')[0]
	const [year, month, day] = dateStr.split('-').map(Number)
	const [hours, minutes] = time.split(':').map(Number)
	return createDateInSaoPaulo(year, month - 1, day, hours, minutes)
}

/**
 * Handler POST: processa lembretes automáticos.
 *
 * @param request - Requisição com header x-webhook-auth
 * @returns JSON com contadores de enviados/erros/pulados
 */
export const POST = async (request: NextRequest) => {
	try {
		const authToken = request.headers.get('x-webhook-auth')
		const expectedToken = process.env.WEBHOOK_AUTH_TOKEN

		if (!expectedToken || authToken !== expectedToken) {
			return NextResponse.json(
				{ error: 'Não autorizado.' },
				{ status: 401 },
			)
		}

		const now = new Date()

		// appointmentDate no banco = data SP armazenada como meia-noite UTC.
		// Usamos a data SP atual (via Intl) para montar o filtro corretamente,
		// evitando excluir agendamentos de hoje quando UTC já virou o dia.
		const spNow = getDateComponentsInSaoPaulo(now)
		const startOfTodaySp = new Date(Date.UTC(spNow.year, spNow.month, spNow.day, 0, 0, 0, 0))

		const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + WINDOW_MARGIN_MS)

		const appointments = await prisma.appointment.findMany({
			where: {
				status: 'confirmed',
				appointmentDate: {
					gte: startOfTodaySp,
					lte: sevenDaysFromNow,
				},
			},
			include: {
				service: { select: { name: true, price: true, duration: true } },
				employee: { select: { name: true } },
				user: {
					select: {
						id: true,
						name: true,
						messageConfig: true,
					},
				},
				reminderLogs: { select: { type: true } },
			},
		})

		let sent = 0
		let skipped = 0
		let errors = 0

		for (const appointment of appointments) {
			const appointmentDt = getAppointmentDateTime(appointment.appointmentDate, appointment.time)
			const msUntilAppointment = appointmentDt.getTime() - now.getTime()

			if (msUntilAppointment <= 0) {
				skipped++
				continue
			}

			const config = appointment.user.messageConfig
			const alreadySentTypes = new Set(appointment.reminderLogs.map((l) => l.type))

			for (const [reminderType, window] of Object.entries(REMINDER_WINDOWS)) {
				if (alreadySentTypes.has(reminderType)) {
					continue
				}

				const isActive = config
					? config[window.configKey as keyof typeof config] as boolean
					: true

				if (!isActive) {
					continue
				}

				const diff = msUntilAppointment - window.beforeMs
				if (diff > WINDOW_MARGIN_MS || diff < -WINDOW_MARGIN_MS) {
					continue
				}

				const channel = config?.reminderChannel ?? 'whatsapp'
				const baseUrl = getBaseUrl()
				const managementLink = appointment.managementToken
					? `${baseUrl}/agendamento/gerenciar/${appointment.managementToken}`
					: ''

				const dateStr = appointment.appointmentDate.toISOString().split('T')[0]

				try {
					await sendGlobalMessage({
						type: reminderType as GlobalMessageType,
						userId: appointment.user.id,
						channel: channel as 'whatsapp' | 'email' | 'both',
						clientName: appointment.name,
						clientPhone: appointment.phone,
						clientEmail: appointment.email,
						appointmentDate: dateStr ?? '',
						appointmentTime: appointment.time,
						serviceName: appointment.service.name,
						servicePrice: String(appointment.service.price),
						serviceDuration: String(appointment.service.duration),
						employeeName: appointment.employee.name,
						managementLink,
						professionalName: appointment.user.name ?? '',
						message: `Olá ${appointment.name}! Lembrete: você tem um agendamento de ${appointment.service.name} em ${window.label}.`,
					})

					await prisma.reminderLog.create({
						data: {
							appointmentId: appointment.id,
							type: reminderType,
							channel,
							status: 'sent',
						},
					})

					sent++
				} catch (err) {
					console.error(`[CRON REMINDERS] Erro ao enviar ${reminderType} para appointment ${appointment.id}:`, {
						error: err instanceof Error ? err.message : 'Erro desconhecido',
					})

					try {
						await prisma.reminderLog.create({
							data: {
								appointmentId: appointment.id,
								type: reminderType,
								channel,
								status: 'failed',
							},
						})
					} catch {
						// unique constraint violation = já registrado
					}

					errors++
				}
			}
		}

		return NextResponse.json({
			success: true,
			processed: appointments.length,
			sent,
			skipped,
			errors,
		})
	} catch (error) {
		console.error('[CRON REMINDERS] Erro geral:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return NextResponse.json(
			{ error: 'Erro interno ao processar lembretes.' },
			{ status: 500 },
		)
	}
}
