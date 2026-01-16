/**
 * Utilitario - Rate Limit
 *
 * Visao geral:
 * - Funcoes de suporte para Rate Limit.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Fornecer utilitarios de dominio ou infraestrutura.
 * - Padronizar formatos e regras reutilizaveis.
 * - Evitar duplicacao de logica.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/lib/rate-limit";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const IP_WINDOW_MINUTES = 10
const IP_MAX_ATTEMPTS = 10
const IP_BLOCK_MINUTES = 15
const PROGRESSIVE_LOCKS = [
	{ attempts: 5, minutes: 10 },
	{ attempts: 8, minutes: 30 },
	{ attempts: 10, minutes: 60 },
]
export const checkIpRateLimit = async (ip: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const now = new Date()
	const record = await prisma.ipRateLimit.findUnique({
		where: { ip },
	})
	if (!record) {
		await prisma.ipRateLimit.create({
			data: {
				ip,
				count: 1,
				firstAttemptAt: now,
			},
		})
		return { allowed: true }
	}
	if (record.blockedUntil && record.blockedUntil > now) {
		return { allowed: false, blockedUntil: record.blockedUntil }
	}
	const windowStart = new Date(now.getTime() - IP_WINDOW_MINUTES * 60 * 1000)
	const shouldReset = record.firstAttemptAt < windowStart
	const nextCount = shouldReset ? 1 : record.count + 1
	const blockedUntil =
		nextCount > IP_MAX_ATTEMPTS
			? new Date(now.getTime() + IP_BLOCK_MINUTES * 60 * 1000)
			: null
	await prisma.ipRateLimit.update({
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
}
export const getLoginAttempt = async (email: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return prisma.loginAttempt.findFirst({
		where: { email },
	})
}
export const recordLoginFailure = async (email: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
export const recordLoginSuccess = async (email: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
