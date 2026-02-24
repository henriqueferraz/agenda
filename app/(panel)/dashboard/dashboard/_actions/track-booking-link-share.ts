/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Server action para registrar eventos de compartilhamento do link público
 * de agendamento por canal (WhatsApp, Instagram, Facebook, TikTok e cópia).
 *
 * @example
 * import { trackBookingLinkShare } from '@/app/(panel)/dashboard/dashboard/_actions/track-booking-link-share'
 * await trackBookingLinkShare({ source: 'whatsapp' })
 */
'use server'

import { z } from 'zod'
import { getUserFromToken } from '@/lib/auth'
import { logSecurityEvent } from '@/lib/security-log'

const trackBookingLinkShareSchema = z.object({
	source: z.enum(['whatsapp', 'instagram', 'facebook', 'tiktok', 'copy']),
})

/**
 * Resposta da action de tracking do link de agendamento.
 */
export interface TrackBookingLinkShareResponse {
	/** Indica se o evento foi registrado com sucesso. */
	success: boolean
	/** Mensagem de retorno para observabilidade no cliente. */
	message: string
}

/**
 * Registra o canal de compartilhamento do link público no SecurityLog.
 *
 * @param data - Dados do tracking contendo o canal de origem
 * @param data.source - Canal de compartilhamento do link público
 * @returns Resultado da operação com status e mensagem
 *
 * @example
 * ```typescript
 * await trackBookingLinkShare({ source: 'facebook' })
 * ```
 */
export const trackBookingLinkShare = async (
	data: z.infer<typeof trackBookingLinkShareSchema>,
): Promise<TrackBookingLinkShareResponse> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id) {
			return {
				success: false,
				message: 'Usuário não autenticado.',
			}
		}

		const validatedData = trackBookingLinkShareSchema.parse(data)

		await logSecurityEvent({
			userId: session.id,
			action: 'BOOKING_LINK_SHARE',
			metadata: {
				source: validatedData.source,
				channel: 'public_booking_link',
			},
		})

		return {
			success: true,
			message: 'Evento de compartilhamento registrado.',
		}
	} catch (error) {
		console.error('Erro ao registrar tracking de compartilhamento:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})

		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: error.issues[0]?.message || 'Fonte de compartilhamento inválida.',
			}
		}

		return {
			success: false,
			message: 'Erro ao registrar compartilhamento.',
		}
	}
}
