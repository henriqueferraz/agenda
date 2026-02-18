/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Assinatura e verificação HMAC-SHA256 para mensagens globais (rota GLOBAL_N8N).
 * Garante que apenas requisições assinadas com GLOBAL_WEBHOOK_SECRET sejam
 * aceitas pelo N8N. Se o header x-global-signature estiver ausente ou inválido,
 * o N8N descarta a mensagem.
 *
 * Separado do webhook-hmac.ts (que usa WEBHOOK_SECRET para a rota BASE_N8N)
 * para manter isolamento de segurança entre as duas rotas.
 *
 * @example
 * import { generateGlobalSignature, verifyGlobalSignature } from '@/lib/global-webhook-hmac'
 *
 * const signature = generateGlobalSignature(JSON.stringify(payload))
 * const isValid = verifyGlobalSignature(bodyString, signatureHeader)
 */
import { createHmac, timingSafeEqual } from 'crypto'

/** Nome do header HTTP usado para enviar a assinatura ao N8N. */
export const GLOBAL_SIGNATURE_HEADER = 'x-global-signature'

/**
 * Gera a assinatura HMAC-SHA256 para o body de uma mensagem global.
 * Usada server-side antes de enviar ao N8N via GLOBAL_N8N.
 *
 * @param body - Corpo da requisição como string (JSON.stringify do payload)
 * @returns Assinatura HMAC-SHA256 em hexadecimal (64 caracteres)
 * @throws Error se GLOBAL_WEBHOOK_SECRET não estiver configurado
 *
 * @example
 * const payload = JSON.stringify({ type: 'reminder_24h', message: '...' })
 * const signature = generateGlobalSignature(payload)
 * // Retorna: '6ecf07ef7c4da951...'
 */
export const generateGlobalSignature = (body: string): string => {
	const secret = process.env.GLOBAL_WEBHOOK_SECRET
	if (!secret) {
		throw new Error('GLOBAL_WEBHOOK_SECRET não está configurado')
	}

	return createHmac('sha256', secret).update(body).digest('hex')
}

/**
 * Verifica a assinatura HMAC-SHA256 de uma mensagem global recebida.
 * Usa timingSafeEqual para prevenir timing attacks.
 *
 * @param body - Corpo da requisição como string (JSON.stringify do payload)
 * @param signatureHeader - Valor do header x-global-signature (hex)
 * @returns true se a assinatura é válida, false caso contrário
 *
 * @example
 * const bodyStr = await request.text()
 * const signature = request.headers.get('x-global-signature')
 * const isValid = verifyGlobalSignature(bodyStr, signature)
 */
export const verifyGlobalSignature = (
	body: string,
	signatureHeader: string | null,
): boolean => {
	const secret = process.env.GLOBAL_WEBHOOK_SECRET
	if (!secret) {
		console.error('[GLOBAL HMAC] GLOBAL_WEBHOOK_SECRET não está configurado')
		return false
	}

	if (!signatureHeader) return false

	try {
		const expectedSignature = createHmac('sha256', secret)
			.update(body)
			.digest('hex')

		const expectedBuffer = Buffer.from(expectedSignature, 'hex')
		const receivedBuffer = Buffer.from(signatureHeader, 'hex')

		if (expectedBuffer.length !== receivedBuffer.length) return false

		return timingSafeEqual(expectedBuffer, receivedBuffer)
	} catch {
		return false
	}
}
