/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Sistema de alerta de tentativas de invasão.
 * Monitora IPs com bloqueios frequentes no rate limiting e registra
 * alertas no SecurityLog. Threshold: 3+ bloqueios em 1 hora.
 *
 * Integra com lib/security-log.ts para persistência e lib/logger.ts para logs.
 *
 * @example
 * import { checkAndAlertIntrusion } from '@/lib/intrusion-alert'
 *
 * await checkAndAlertIntrusion('192.168.1.1', '/api/auth/login')
 */
import prisma from '@/lib/prisma'
import { logSecurityEvent } from '@/lib/security-log'
import { logger } from '@/lib/logger'

/** Número mínimo de bloqueios para disparar alerta */
const ALERT_THRESHOLD = 3

/** Janela de tempo para contar bloqueios (1 hora em ms) */
const ALERT_WINDOW_MS = 60 * 60 * 1000

/** Cooldown entre alertas do mesmo IP (30 minutos em ms) */
const ALERT_COOLDOWN_MS = 30 * 60 * 1000

/** Cache em memória: IP → timestamp do último alerta enviado */
const alertCooldowns = new Map<string, number>()

/**
 * Verifica se um IP está em cooldown de alerta.
 * Evita spam de alertas para o mesmo IP.
 *
 * @param ip - Endereço IP a verificar
 * @returns true se ainda está em cooldown (alerta recente enviado)
 */
const isInCooldown = (ip: string): boolean => {
	const lastAlert = alertCooldowns.get(ip)
	if (!lastAlert) return false
	return Date.now() - lastAlert < ALERT_COOLDOWN_MS
}

/**
 * Conta quantas vezes um IP foi bloqueado nos SecurityLogs na última hora.
 *
 * @param ip - Endereço IP a consultar
 * @returns Número de bloqueios registrados na janela de tempo
 *
 * @example
 * const count = await countRecentBlocks('192.168.1.1') // 5
 */
export const countRecentBlocks = async (ip: string): Promise<number> => {
	const windowStart = new Date(Date.now() - ALERT_WINDOW_MS)
	return prisma.securityLog.count({
		where: {
			ip,
			action: 'IP_RATE_LIMIT_BLOCKED',
			createdAt: { gte: windowStart },
		},
	})
}

/**
 * Registra um bloqueio de rate limit por IP no SecurityLog.
 *
 * @param ip - Endereço IP bloqueado
 * @param route - Rota que o IP tentou acessar
 *
 * @example
 * await recordIpBlock('192.168.1.1', '/api/auth/login')
 */
export const recordIpBlock = async (ip: string, route: string): Promise<void> => {
	await logSecurityEvent({
		ip,
		action: 'IP_RATE_LIMIT_BLOCKED',
		metadata: { route, timestamp: new Date().toISOString() },
	})
}

/**
 * Verifica bloqueios recentes de um IP e emite alerta se o threshold for atingido.
 * Registra o bloqueio atual, conta os recentes e, se >= 3 na última hora,
 * registra um alerta INTRUSION_ALERT no SecurityLog.
 *
 * @param ip - Endereço IP que foi bloqueado
 * @param route - Rota acessada pelo IP
 * @returns true se um alerta de intrusão foi emitido, false caso contrário
 *
 * @example
 * const alerted = await checkAndAlertIntrusion('192.168.1.1', '/api/auth/login')
 * if (alerted) console.log('Alerta de intrusão enviado')
 */
export const checkAndAlertIntrusion = async (
	ip: string,
	route: string,
): Promise<boolean> => {
	try {
		// Registra o bloqueio atual
		await recordIpBlock(ip, route)

		// Verifica cooldown para evitar alertas duplicados
		if (isInCooldown(ip)) return false

		// Conta bloqueios recentes
		const recentBlocks = await countRecentBlocks(ip)

		if (recentBlocks >= ALERT_THRESHOLD) {
			// Registra alerta de intrusão no SecurityLog
			await logSecurityEvent({
				ip,
				action: 'INTRUSION_ALERT',
				metadata: {
					blocksInLastHour: recentBlocks,
					lastRoute: route,
					threshold: ALERT_THRESHOLD,
					timestamp: new Date().toISOString(),
				},
			})

			// Log de alerta no logger estruturado
			logger.warn('Alerta de intrusão detectado', {
				ip,
				blocksInLastHour: recentBlocks,
				lastRoute: route,
			})

			// Atualiza cooldown
			alertCooldowns.set(ip, Date.now())

			return true
		}

		return false
	} catch (error) {
		logger.error('Erro ao verificar intrusão', {
			ip,
			route,
			error: error instanceof Error ? error.message : 'Erro desconhecido',
		})
		return false
	}
}

/**
 * Reseta o cache de cooldowns. Apenas para uso em testes.
 *
 * @example
 * _resetAlertCooldowns()
 */
export const _resetAlertCooldowns = (): void => {
	alertCooldowns.clear()
}
