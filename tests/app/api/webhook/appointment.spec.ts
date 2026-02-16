/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes para POST /api/webhook/appointment.
 * Valida autenticacao, proteção anti-replay (timestamp + nonce),
 * validacao de payload e encaminhamento ao N8N.
 *
 * @example
 * npx jest tests/app/api/webhook/appointment.spec.ts
 */
import { POST } from '@/app/api/webhook/appointment/route'
import { createJsonRequest, readJson } from '@/tests/helpers/request'
import { _resetNonceStore } from '@/lib/webhook-nonce'

jest.mock('@/lib/auth', () => ({
	getUserFromRequest: jest.fn(async () => ({ id: 'usr_1', email: 'user@test.com' })),
}))

/** Payload valido no formato esperado pelo schema Zod */
const validPayload = [
	{
		headers: {},
		params: {},
		query: {},
		body: {
			name: 'Cliente',
			email: 'cliente@teste.com',
			phone: '11999999999',
			token_called: null,
			appointments: [
				{
					date: '2026-03-01',
					time: '10:00',
					services: [
						{
							id: 'srv_1',
							name: 'Corte',
							price: 5000,
							duration: 30,
							employee: { id: 'emp_1', name: 'Joao' },
						},
					],
				},
			],
		},
		webhookUrl: '',
		executionMode: 'production',
	},
]

/** Gera headers anti-replay validos (timestamp atual + nonce unico) */
const replayHeaders = () => ({
	'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
	'x-webhook-nonce': crypto.randomUUID(),
})

describe('POST /api/webhook/appointment', () => {
	const originalEnv = process.env.BASE_N8N

	beforeEach(() => {
		jest.clearAllMocks()
		_resetNonceStore()
	})

	afterAll(() => {
		process.env.BASE_N8N = originalEnv
	})

	test('retorna 401 sem autenticacao', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValueOnce(null)
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(401)
	})

	test('retorna 400 sem header x-webhook-timestamp', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: { 'x-webhook-nonce': crypto.randomUUID() } },
		)
		const response = await POST(request)
		const body = await readJson<{ error: string }>(response)
		expect(response.status).toBe(400)
		expect(body.error).toContain('Timestamp')
	})

	test('retorna 400 com timestamp expirado (> 5 minutos)', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 6 * 60) // 6 min atras
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{
				headers: {
					'x-webhook-timestamp': expiredTimestamp,
					'x-webhook-nonce': crypto.randomUUID(),
				},
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})

	test('retorna 400 sem header x-webhook-nonce', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{
				headers: {
					'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
				},
			},
		)
		const response = await POST(request)
		const body = await readJson<{ error: string }>(response)
		expect(response.status).toBe(400)
		expect(body.error).toContain('nonce')
	})

	test('retorna 400 com nonce duplicado (replay attack)', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as typeof fetch

		const fixedNonce = crypto.randomUUID()

		// Primeira requisição: sucesso
		const request1 = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{
				headers: {
					'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
					'x-webhook-nonce': fixedNonce,
				},
			},
		)
		const response1 = await POST(request1)
		expect(response1.status).toBe(200)

		// Segunda requisição com mesmo nonce: rejeitada
		const request2 = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{
				headers: {
					'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
					'x-webhook-nonce': fixedNonce,
				},
			},
		)
		const response2 = await POST(request2)
		expect(response2.status).toBe(400)
		const body = await readJson<{ error: string }>(response2)
		expect(body.error).toContain('duplicada')
	})

	test('retorna 500 quando webhook nao configurado', async () => {
		delete process.env.BASE_N8N
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})

	test('retorna 400 para payload invalido', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			{ invalid: true },
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})

	test('retorna 200 quando webhook responde ok', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as typeof fetch
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		const body = await readJson<{ success: boolean }>(response)
		expect(response.status).toBe(200)
		expect(body.success).toBe(true)
	})

	test('envia header x-webhook-signature quando WEBHOOK_SECRET esta configurado', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		process.env.WEBHOOK_SECRET = 'test-hmac-secret'
		const fetchMock = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as jest.Mock
		global.fetch = fetchMock as unknown as typeof fetch

		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		await POST(request)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const callArgs = fetchMock.mock.calls[0]
		const outboundHeaders = callArgs[1].headers as Record<string, string>
		expect(outboundHeaders['x-webhook-signature']).toBeDefined()
		expect(outboundHeaders['x-webhook-signature']).toMatch(/^[0-9a-f]{64}$/)
		delete process.env.WEBHOOK_SECRET
	})

	test('nao envia x-webhook-signature sem WEBHOOK_SECRET', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		delete process.env.WEBHOOK_SECRET
		const fetchMock = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as jest.Mock
		global.fetch = fetchMock as unknown as typeof fetch

		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		await POST(request)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const callArgs = fetchMock.mock.calls[0]
		const outboundHeaders = callArgs[1].headers as Record<string, string>
		expect(outboundHeaders['x-webhook-signature']).toBeUndefined()
	})

	test('retorna status da falha do webhook', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: false,
			status: 500,
			text: async () => 'erro',
		})) as unknown as typeof fetch
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})

	test('retorna 500 quando fetch lanca erro', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => {
			throw new Error('network')
		}) as unknown as typeof fetch
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})

	test('aceita payload com campo type cancel (F-02)', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as typeof fetch

		const cancelPayload = [
			{
				...validPayload[0],
				body: {
					...validPayload[0].body,
					type: 'cancel',
					cancelReason: 'Cliente desistiu',
				},
			},
		]

		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			cancelPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})

	test('aceita payload com campo type reschedule e oldDate/oldTime (F-02)', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as typeof fetch

		const reschedulePayload = [
			{
				...validPayload[0],
				body: {
					...validPayload[0].body,
					type: 'reschedule',
					oldDate: '2026-02-15',
					oldTime: '09:00',
				},
			},
		]

		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			reschedulePayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})

	test('payload sem type usa default create (retrocompatibilidade F-02)', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		const fetchMock = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as jest.Mock
		global.fetch = fetchMock as unknown as typeof fetch

		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
			{ headers: replayHeaders() },
		)
		const response = await POST(request)
		expect(response.status).toBe(200)

		const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string)
		expect(sentBody[0].body.type).toBe('create')
	})
})
