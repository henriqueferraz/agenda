/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/global-webhook-hmac.ts.
 * Valida geração e verificação de assinatura HMAC-SHA256 para mensagens globais
 * enviadas via rota GLOBAL_N8N.
 *
 * @example
 * npx jest tests/lib/global-webhook-hmac.spec.ts
 */
import {
	generateGlobalSignature,
	verifyGlobalSignature,
	GLOBAL_SIGNATURE_HEADER,
} from '@/lib/global-webhook-hmac'

describe('global-webhook-hmac', () => {
	const originalSecret = process.env.GLOBAL_WEBHOOK_SECRET

	beforeEach(() => {
		process.env.GLOBAL_WEBHOOK_SECRET = 'test-global-secret-key-for-hmac'
	})

	afterAll(() => {
		process.env.GLOBAL_WEBHOOK_SECRET = originalSecret
	})

	describe('GLOBAL_SIGNATURE_HEADER', () => {
		test('header é x-global-signature', () => {
			expect(GLOBAL_SIGNATURE_HEADER).toBe('x-global-signature')
		})
	})

	describe('generateGlobalSignature', () => {
		test('gera assinatura hex válida de 64 caracteres', () => {
			const sig = generateGlobalSignature('{"type":"reminder_24h"}')
			expect(sig).toMatch(/^[0-9a-f]{64}$/)
		})

		test('mesma entrada gera mesma assinatura', () => {
			const body = '{"type":"custom_individual","message":"Olá"}'
			const sig1 = generateGlobalSignature(body)
			const sig2 = generateGlobalSignature(body)
			expect(sig1).toBe(sig2)
		})

		test('entradas diferentes geram assinaturas diferentes', () => {
			const sig1 = generateGlobalSignature('{"type":"reminder_24h"}')
			const sig2 = generateGlobalSignature('{"type":"reminder_2h"}')
			expect(sig1).not.toBe(sig2)
		})

		test('lança erro sem GLOBAL_WEBHOOK_SECRET', () => {
			delete process.env.GLOBAL_WEBHOOK_SECRET
			expect(() => generateGlobalSignature('body')).toThrow('GLOBAL_WEBHOOK_SECRET')
		})

		test('gera assinatura diferente do webhook de agendamento', () => {
			process.env.WEBHOOK_SECRET = 'different-secret'
			const body = '{"test":true}'
			const globalSig = generateGlobalSignature(body)

			const { generateWebhookSignature } = require('@/lib/webhook-hmac')
			const webhookSig = generateWebhookSignature(body)

			expect(globalSig).not.toBe(webhookSig)
			delete process.env.WEBHOOK_SECRET
		})
	})

	describe('verifyGlobalSignature', () => {
		test('valida assinatura correta', () => {
			const body = '{"type":"client_cancelled","recipients":[]}'
			const sig = generateGlobalSignature(body)
			expect(verifyGlobalSignature(body, sig)).toBe(true)
		})

		test('rejeita assinatura incorreta', () => {
			const body = '{"type":"reminder_24h"}'
			expect(verifyGlobalSignature(body, 'a'.repeat(64))).toBe(false)
		})

		test('rejeita assinatura null', () => {
			expect(verifyGlobalSignature('body', null)).toBe(false)
		})

		test('rejeita body alterado (integridade)', () => {
			const body = '{"type":"reminder_24h","message":"original"}'
			const sig = generateGlobalSignature(body)
			expect(verifyGlobalSignature('{"type":"reminder_24h","message":"adulterado"}', sig)).toBe(false)
		})

		test('retorna false sem GLOBAL_WEBHOOK_SECRET', () => {
			const body = '{"test":true}'
			const sig = generateGlobalSignature(body)
			delete process.env.GLOBAL_WEBHOOK_SECRET
			expect(verifyGlobalSignature(body, sig)).toBe(false)
		})

		test('rejeita assinatura com tamanho errado', () => {
			expect(verifyGlobalSignature('body', 'short')).toBe(false)
		})

		test('rejeita string vazia como assinatura', () => {
			expect(verifyGlobalSignature('body', '')).toBe(false)
		})

		test('rejeita assinatura com caracteres inválidos (não hex)', () => {
			expect(verifyGlobalSignature('body', 'z'.repeat(64))).toBe(false)
		})
	})
})
