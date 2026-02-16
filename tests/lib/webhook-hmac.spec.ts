/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/webhook-hmac.ts.
 * Valida geração e verificação de assinatura HMAC-SHA256 para webhooks.
 *
 * @example
 * npx jest tests/lib/webhook-hmac.spec.ts
 */
import { verifyWebhookSignature, generateWebhookSignature } from '@/lib/webhook-hmac'

describe('webhook-hmac', () => {
	const originalSecret = process.env.WEBHOOK_SECRET

	beforeEach(() => {
		process.env.WEBHOOK_SECRET = 'test-secret-key-for-hmac-validation'
	})

	afterAll(() => {
		process.env.WEBHOOK_SECRET = originalSecret
	})

	describe('generateWebhookSignature', () => {
		test('gera assinatura hex valida', () => {
			const sig = generateWebhookSignature('{"test":true}')
			expect(sig).toMatch(/^[0-9a-f]{64}$/)
		})

		test('mesma entrada gera mesma assinatura', () => {
			const body = '{"name":"teste"}'
			const sig1 = generateWebhookSignature(body)
			const sig2 = generateWebhookSignature(body)
			expect(sig1).toBe(sig2)
		})

		test('entradas diferentes geram assinaturas diferentes', () => {
			const sig1 = generateWebhookSignature('{"a":1}')
			const sig2 = generateWebhookSignature('{"a":2}')
			expect(sig1).not.toBe(sig2)
		})

		test('lanca erro sem WEBHOOK_SECRET', () => {
			delete process.env.WEBHOOK_SECRET
			expect(() => generateWebhookSignature('body')).toThrow('WEBHOOK_SECRET')
		})
	})

	describe('verifyWebhookSignature', () => {
		test('valida assinatura correta', () => {
			const body = '{"appointments":[]}'
			const sig = generateWebhookSignature(body)
			expect(verifyWebhookSignature(body, sig)).toBe(true)
		})

		test('rejeita assinatura incorreta', () => {
			const body = '{"appointments":[]}'
			expect(verifyWebhookSignature(body, 'a'.repeat(64))).toBe(false)
		})

		test('rejeita assinatura null', () => {
			expect(verifyWebhookSignature('body', null)).toBe(false)
		})

		test('rejeita body alterado', () => {
			const body = '{"name":"original"}'
			const sig = generateWebhookSignature(body)
			expect(verifyWebhookSignature('{"name":"modificado"}', sig)).toBe(false)
		})

		test('retorna false sem WEBHOOK_SECRET', () => {
			const body = 'test'
			const sig = generateWebhookSignature(body)
			delete process.env.WEBHOOK_SECRET
			expect(verifyWebhookSignature(body, sig)).toBe(false)
		})

		test('rejeita assinatura com tamanho errado', () => {
			expect(verifyWebhookSignature('body', 'short')).toBe(false)
		})
	})
})
