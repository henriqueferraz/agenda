/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Modulo de rate limiting - Protecao contra brute force
 *
 * Implementa rate limiting por IP e por email usando modelos Prisma.
 * IPs sao bloqueados apos 10 tentativas em 10min.
 * Emails tem bloqueio progressivo: 5 tentativas=10min, 8=30min, 10=60min.
 *
 * @example
 * import { checkIpRateLimit, recordLoginFailure, recordLoginSuccess } from '@/lib/rate-limit'
 *
 * const ipCheck = await checkIpRateLimit('192.168.1.1')
 * if (!ipCheck.allowed) return // IP bloqueado
 *
 * const lockedUntil = await recordLoginFailure('user@email.com')
 * await recordLoginSuccess('user@email.com') // reseta contador
 */
import prisma from '@/lib/prisma'

/** Janela de tempo para rate limit de IP (minutos) */
const IP_WINDOW_MINUTES = 10
/** Maximo de tentativas por IP antes do bloqueio */
const IP_MAX_ATTEMPTS = 10
/** Duracao do bloqueio por IP (minutos) */
const IP_BLOCK_MINUTES = 15
/** Configuracao de bloqueio progressivo por tentativas de login */
const PROGRESSIVE_LOCKS = [
	{ attempts: 5, minutes: 10 },
	{ attempts: 8, minutes: 30 },
	{ attempts: 10, minutes: 60 },
]

/**
 * Verifica se um IP esta dentro do limite de requisicoes permitidas.
 * Usa upsert atomico dentro de $transaction para evitar race condition
 * no padrao read-then-write (duas requisicoes simultaneas nao criam duplicatas).
 * @param ip - Endereco IP a ser verificado
 * @returns Objeto { allowed: boolean, blockedUntil?: Date }
 * @example
 * const result = await checkIpRateLimit('192.168.1.1')
 * if (!result.allowed) console.log('Bloqueado ate:', result.blockedUntil)
 */
export const checkIpRateLimit = async (ip: string) => {
	const now = new Date()
	const windowStart = new Date(now.getTime() - IP_WINDOW_MINUTES * 60 * 1000)

	return await prisma.$transaction(async (tx) => {
		// Upsert atomico: cria registro se nao existe, retorna existente se ja existe
		const record = await tx.ipRateLimit.upsert({
			where: { ip },
			create: {
				ip,
				count: 0,
				firstAttemptAt: now,
			},
			update: {},
		})

		// Se esta bloqueado, retorna imediatamente
		if (record.blockedUntil && record.blockedUntil > now) {
			return { allowed: false, blockedUntil: record.blockedUntil }
		}

		// Verifica se a janela de tempo expirou (reset do contador)
		const shouldReset = record.firstAttemptAt < windowStart
		const nextCount = shouldReset ? 1 : record.count + 1

		// Bloqueia se exceder limite de tentativas
		const blockedUntil =
			nextCount > IP_MAX_ATTEMPTS
				? new Date(now.getTime() + IP_BLOCK_MINUTES * 60 * 1000)
				: null

		// Atualiza atomicamente dentro da transacao
		await tx.ipRateLimit.update({
			where: { ip },
			data: {
				count: nextCount,
				firstAttemptAt: shouldReset ? now : record.firstAttemptAt,
				blockedUntil,
			},
		})

		if (blockedUntil) {
			return { allowed: false, blockedUntil }
		}
		return { allowed: true }
	})
}

/**
 * Busca o registro de tentativas de login para um email.
 * @param email - Email a ser consultado
 * @returns Registro de LoginAttempt ou null
 * @example
 * const attempt = await getLoginAttempt('user@email.com')
 * if (attempt?.lockedUntil) console.log('Conta bloqueada')
 */
export const getLoginAttempt = async (email: string) => {
	return prisma.loginAttempt.findFirst({
		where: { email },
	})
}

/**
 * Registra uma falha de login e aplica bloqueio progressivo se necessario.
 * Bloqueios: 5 tentativas=10min, 8 tentativas=30min, 10 tentativas=60min.
 * @param email - Email que falhou o login
 * @returns Data ate quando a conta esta bloqueada, ou null se nao bloqueada
 * @example
 * const lockedUntil = await recordLoginFailure('user@email.com')
 * if (lockedUntil) console.log('Bloqueado ate:', lockedUntil)
 */
export const recordLoginFailure = async (email: string) => {
	const now = new Date()
	const attempt = await prisma.loginAttempt.findFirst({
		where: { email },
	})
	if (!attempt) {
		await prisma.loginAttempt.create({
			data: {
				email,
				count: 1,
				lastAttempt: now,
			},
		})
		return null
	}
	const nextCount = attempt.count + 1
	const lockConfig = PROGRESSIVE_LOCKS.filter(
		(item) => nextCount >= item.attempts,
	).slice(-1)[0]
	const lockedUntil = lockConfig
		? new Date(now.getTime() + lockConfig.minutes * 60 * 1000)
		: attempt.lockedUntil
	await prisma.loginAttempt.update({
		where: { id: attempt.id },
		data: {
			count: nextCount,
			lastAttempt: now,
			lockedUntil,
		},
	})
	return lockedUntil
}

/**
 * Reseta o contador de tentativas apos login bem-sucedido.
 * @param email - Email que fez login com sucesso
 * @example
 * await recordLoginSuccess('user@email.com')
 */
export const recordLoginSuccess = async (email: string) => {
	const attempt = await prisma.loginAttempt.findFirst({
		where: { email },
	})
	if (!attempt) return
	await prisma.loginAttempt.update({
		where: { id: attempt.id },
		data: {
			count: 0,
			lockedUntil: null,
		},
	})
}
