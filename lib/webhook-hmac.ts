/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Validação HMAC-SHA256 para webhook de agendamentos.
 * Garante que apenas requisições legítimas (assinadas com WEBHOOK_SECRET)
 * sejam processadas pelo servidor.
 *
 * O emissor calcula HMAC-SHA256 do body com o secret e envia no header
 * x-webhook-signature. O servidor recalcula e compara com timingSafeEqual.
 *
 * @example
 * import { verifyWebhookSignature } from '@/lib/webhook-hmac'
 *
 * const isValid = verifyWebhookSignature(bodyString, signatureHeader)
 */
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verifica a assinatura HMAC-SHA256 do body do webhook.
 * Usa timingSafeEqual para prevenir timing attacks.
 *
 * @param body - Corpo da requisição como string (JSON.stringify do payload)
 * @param signatureHeader - Valor do header x-webhook-signature (hex)
 * @returns true se a assinatura é válida, false caso contrário
 *
 * @example
 * const bodyStr = JSON.stringify(payload)
 * const isValid = verifyWebhookSignature(bodyStr, 'a1b2c3d4...')
 */
export const verifyWebhookSignature = (
	body: string,
	signatureHeader: string | null,
): boolean => {
	const secret = process.env.WEBHOOK_SECRET
	if (!secret) {
		console.error('[WEBHOOK HMAC] WEBHOOK_SECRET não está configurado')
		return false
	}

	if (!signatureHeader) return false

	const expectedSignature = createHmac('sha256', secret)
		.update(body)
		.digest('hex')

	const expectedBuffer = Buffer.from(expectedSignature, 'hex')
	const receivedBuffer = Buffer.from(signatureHeader, 'hex')

	if (expectedBuffer.length !== receivedBuffer.length) return false

	return timingSafeEqual(expectedBuffer, receivedBuffer)
}

/**
 * Gera a assinatura HMAC-SHA256 para um body de webhook.
 * Usado server-side para assinar requisições antes de enviar.
 *
 * @param body - Corpo da requisição como string
 * @returns Assinatura HMAC-SHA256 em hexadecimal
 *
 * @example
 * const signature = generateWebhookSignature(JSON.stringify(payload))
 * // Retorna: 'a1b2c3d4e5f6...'
 */
export const generateWebhookSignature = (body: string): string => {
	const secret = process.env.WEBHOOK_SECRET
	if (!secret) {
		throw new Error('WEBHOOK_SECRET não está configurado')
	}

	return createHmac('sha256', secret).update(body).digest('hex')
}
