/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Data access para consultar métricas de compartilhamento do link público
 * de agendamento com base nos eventos BOOKING_LINK_SHARE em SecurityLog.
 *
 * @example
 * import { getBookingLinkShareStats } from '@/app/(panel)/dashboard/dashboard/_data-access/get-booking-link-share-stats'
 * const stats = await getBookingLinkShareStats({ userId: 'usr_123' })
 */
'use server'

import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

type ShareSource = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'copy'

/**
 * Métricas de compartilhamento por canal.
 */
export interface BookingLinkShareStats {
	/** Total de eventos de compartilhamento no período. */
	total: number
	/** Eventos de compartilhamento via WhatsApp. */
	whatsapp: number
	/** Eventos de compartilhamento via Instagram. */
	instagram: number
	/** Eventos de compartilhamento via Facebook. */
	facebook: number
	/** Eventos de compartilhamento via TikTok. */
	tiktok: number
	/** Eventos de cópia manual do link. */
	copy: number
}

interface GetBookingLinkShareStatsProps {
	/** ID do usuário (empresa) para validação de escopo da consulta. */
	userId: string
}

const DEFAULT_STATS: BookingLinkShareStats = {
	total: 0,
	whatsapp: 0,
	instagram: 0,
	facebook: 0,
	tiktok: 0,
	copy: 0,
}

const SHARE_SOURCES: ShareSource[] = [
	'whatsapp',
	'instagram',
	'facebook',
	'tiktok',
	'copy',
]

/**
 * Extrai a origem do metadata do SecurityLog com validação defensiva.
 *
 * @param metadata - Campo JSON do log de segurança
 * @returns Origem válida de compartilhamento ou null
 *
 * @example
 * ```typescript
 * const source = getShareSourceFromMetadata({ source: 'whatsapp' })
 * // 'whatsapp'
 * ```
 */
const getShareSourceFromMetadata = (metadata: unknown): ShareSource | null => {
	if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
		return null
	}

	const source = (metadata as Record<string, unknown>).source
	if (typeof source !== 'string') {
		return null
	}

	if (SHARE_SOURCES.includes(source as ShareSource)) {
		return source as ShareSource
	}

	return null
}

/**
 * Busca e agrega métricas de compartilhamento dos últimos 30 dias.
 *
 * @param props - Parâmetros da consulta
 * @param props.userId - ID do usuário autenticado
 * @returns Contadores agregados por canal e total
 *
 * @example
 * ```typescript
 * const stats = await getBookingLinkShareStats({ userId: 'usr_123' })
 * console.log(stats.total)
 * ```
 */
export const getBookingLinkShareStats = async ({
	userId,
}: GetBookingLinkShareStatsProps): Promise<BookingLinkShareStats> => {
	try {
		const session = await getUserFromToken()
		if (!session?.id || session.id !== userId) {
			return DEFAULT_STATS
		}

		const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
		const logs = await prisma.securityLog.findMany({
			where: {
				userId,
				action: 'BOOKING_LINK_SHARE',
				createdAt: {
					gte: startDate,
				},
			},
			select: {
				metadata: true,
			},
		})

		const stats: BookingLinkShareStats = { ...DEFAULT_STATS }
		for (const log of logs) {
			const source = getShareSourceFromMetadata(log.metadata)
			if (!source) {
				continue
			}

			stats[source] += 1
			stats.total += 1
		}

		return stats
	} catch (error) {
		console.error('Erro ao buscar métricas de compartilhamento:', {
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return DEFAULT_STATS
	}
}
