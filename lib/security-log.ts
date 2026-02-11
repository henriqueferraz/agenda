/**
 * Modulo de log de seguranca - Registro de eventos no banco
 *
 * Registra acoes de seguranca (login, logout, tentativas falhas, etc.)
 * no modelo SecurityLog do Prisma para auditoria.
 *
 * @example
 * import { logSecurityEvent } from '@/lib/security-log'
 *
 * await logSecurityEvent({
 *   userId: 'user_123',
 *   email: 'user@email.com',
 *   ip: '192.168.1.1',
 *   action: 'LOGIN_SUCCESS',
 * })
 */
import type { Prisma } from '@/lib/generated/prisma/client'
import prisma from '@/lib/prisma'

/** Dados de entrada para registro de evento de seguranca */
interface SecurityLogInput {
	/** ID do usuario (opcional para tentativas anonimas) */
	userId?: string
	/** Email associado ao evento */
	email?: string
	/** Endereco IP da requisicao */
	ip?: string
	/** Tipo de acao (LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, etc.) */
	action: string
	/** Dados adicionais em formato JSON */
	metadata?: Prisma.InputJsonValue
}

/**
 * Registra um evento de seguranca no banco de dados.
 * Falhas no registro sao logadas no console sem interromper o fluxo.
 * @param input - Dados do evento (userId, email, ip, action, metadata)
 * @example
 * await logSecurityEvent({ email: 'user@email.com', action: 'LOGIN_FAILURE', ip: '1.2.3.4' })
 */
export const logSecurityEvent = async ({
	userId,
	email,
	ip,
	action,
	metadata,
}: SecurityLogInput) => {
	try {
		await prisma.securityLog.create({
			data: {
				userId,
				email,
				ip,
				action,
				metadata,
			},
		})
	} catch (error) {
		console.error('Erro ao registrar log de segurança:', error)
	}
}
