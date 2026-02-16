/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Proteção contra replay attacks no webhook de agendamentos.
 * Valida timestamp (rejeita requisições > 5 min) e nonce (rejeita duplicatas).
 * Usa store em memória com limpeza lazy para compatibilidade com serverless.
 *
 * @example
 * import { validateWebhookTimestamp, validateWebhookNonce } from '@/lib/webhook-nonce'
 *
 * const isTimestampValid = validateWebhookTimestamp(request.headers.get('x-webhook-timestamp'))
 * const isNonceValid = validateWebhookNonce(request.headers.get('x-webhook-nonce'))
 */

/** TTL para nonces armazenados em milissegundos (10 minutos) */
const NONCE_TTL_MS = 10 * 60 * 1000

/** Diferença máxima permitida entre timestamp do cliente e servidor em ms (5 minutos) */
const MAX_TIMESTAMP_DIFF_MS = 5 * 60 * 1000

/** Intervalo mínimo entre limpezas de nonces expirados em ms (60 segundos) */
const CLEANUP_INTERVAL_MS = 60 * 1000

/** Store em memória: nonce → timestamp de expiração */
const nonceStore = new Map<string, number>()

/** Timestamp da última limpeza executada */
let lastCleanup = Date.now()

/**
 * Remove nonces expirados do store.
 * Chamada de forma lazy a cada validação para evitar setInterval em serverless.
 */
const cleanupExpiredNonces = (): void => {
	const now = Date.now()
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
	lastCleanup = now
	for (const [nonce, expiry] of nonceStore) {
		if (now > expiry) {
			nonceStore.delete(nonce)
		}
	}
}

/**
 * Valida o header x-webhook-timestamp da requisição.
 * Rejeita requisições com timestamp ausente, inválido ou com diferença > 5 minutos.
 *
 * @param timestampHeader - Valor do header x-webhook-timestamp (Unix timestamp em segundos)
 * @returns true se o timestamp é válido e está dentro da janela permitida
 *
 * @example
 * const isValid = validateWebhookTimestamp('1708099200') // true se dentro de 5 min
 * const isInvalid = validateWebhookTimestamp(null)        // false
 */
export const validateWebhookTimestamp = (timestampHeader: string | null): boolean => {
	if (!timestampHeader) return false
	const ts = parseInt(timestampHeader, 10)
	if (isNaN(ts)) return false
	const diff = Math.abs(Date.now() - ts * 1000)
	return diff <= MAX_TIMESTAMP_DIFF_MS
}

/**
 * Valida o header x-webhook-nonce da requisição.
 * Rejeita nonces duplicados (já utilizados) e armazena novos com TTL de 10 minutos.
 *
 * @param nonceHeader - Valor do header x-webhook-nonce (UUID único por requisição)
 * @returns true se o nonce é válido (primeiro uso), false se duplicado ou ausente
 *
 * @example
 * const isValid = validateWebhookNonce('550e8400-e29b-41d4-a716-446655440000') // true (primeiro uso)
 * const isDuplicate = validateWebhookNonce('550e8400-e29b-41d4-a716-446655440000') // false (já usado)
 */
export const validateWebhookNonce = (nonceHeader: string | null): boolean => {
	if (!nonceHeader) return false
	cleanupExpiredNonces()
	if (nonceStore.has(nonceHeader)) return false
	nonceStore.set(nonceHeader, Date.now() + NONCE_TTL_MS)
	return true
}

/**
 * Reseta o store de nonces. Apenas para uso em testes.
 *
 * @example
 * _resetNonceStore() // Limpa todos os nonces armazenados
 */
export const _resetNonceStore = (): void => {
	nonceStore.clear()
}
