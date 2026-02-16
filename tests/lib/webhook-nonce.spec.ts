/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/webhook-nonce.ts.
 * Valida proteção contra replay attacks: timestamp e nonce.
 *
 * @example
 * npx jest tests/lib/webhook-nonce.spec.ts
 */
import {
	validateWebhookTimestamp,
	validateWebhookNonce,
	_resetNonceStore,
} from '@/lib/webhook-nonce'

describe('webhook-nonce', () => {
	beforeEach(() => {
		_resetNonceStore()
	})

	describe('validateWebhookTimestamp', () => {
		test('retorna false para null', () => {
			expect(validateWebhookTimestamp(null)).toBe(false)
		})

		test('retorna false para string vazia', () => {
			expect(validateWebhookTimestamp('')).toBe(false)
		})

		test('retorna false para valor nao numerico', () => {
			expect(validateWebhookTimestamp('abc')).toBe(false)
		})

		test('retorna true para timestamp atual', () => {
			const now = String(Math.floor(Date.now() / 1000))
			expect(validateWebhookTimestamp(now)).toBe(true)
		})

		test('retorna true para timestamp 4 minutos atras', () => {
			const fourMinAgo = String(Math.floor(Date.now() / 1000) - 4 * 60)
			expect(validateWebhookTimestamp(fourMinAgo)).toBe(true)
		})

		test('retorna false para timestamp 6 minutos atras', () => {
			const sixMinAgo = String(Math.floor(Date.now() / 1000) - 6 * 60)
			expect(validateWebhookTimestamp(sixMinAgo)).toBe(false)
		})

		test('retorna false para timestamp 6 minutos no futuro', () => {
			const sixMinFuture = String(Math.floor(Date.now() / 1000) + 6 * 60)
			expect(validateWebhookTimestamp(sixMinFuture)).toBe(false)
		})

		test('retorna true para timestamp 2 minutos no futuro (clock skew)', () => {
			const twoMinFuture = String(Math.floor(Date.now() / 1000) + 2 * 60)
			expect(validateWebhookTimestamp(twoMinFuture)).toBe(true)
		})
	})

	describe('validateWebhookNonce', () => {
		test('retorna false para null', () => {
			expect(validateWebhookNonce(null)).toBe(false)
		})

		test('retorna false para string vazia', () => {
			expect(validateWebhookNonce('')).toBe(false)
		})

		test('retorna true para nonce novo', () => {
			expect(validateWebhookNonce(crypto.randomUUID())).toBe(true)
		})

		test('retorna false para nonce duplicado', () => {
			const nonce = crypto.randomUUID()
			expect(validateWebhookNonce(nonce)).toBe(true)
			expect(validateWebhookNonce(nonce)).toBe(false)
		})

		test('aceita nonces diferentes', () => {
			const nonce1 = crypto.randomUUID()
			const nonce2 = crypto.randomUUID()
			expect(validateWebhookNonce(nonce1)).toBe(true)
			expect(validateWebhookNonce(nonce2)).toBe(true)
		})

		test('reset limpa o store e permite nonce reutilizado', () => {
			const nonce = crypto.randomUUID()
			expect(validateWebhookNonce(nonce)).toBe(true)
			expect(validateWebhookNonce(nonce)).toBe(false)
			_resetNonceStore()
			expect(validateWebhookNonce(nonce)).toBe(true)
		})
	})
})
