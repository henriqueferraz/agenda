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
 * Valida autenticacao, payload e encaminhamento ao N8N.
 *
 * @example
 * npx jest tests/app/api/webhook/appointment.spec.ts
 */
import { POST } from '@/app/api/webhook/appointment/route'
import { createJsonRequest, readJson } from '@/tests/helpers/request'

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

describe('POST /api/webhook/appointment', () => {
	const originalEnv = process.env.NEXT_PUBLIC_BASE_N8N

	beforeEach(() => {
		jest.clearAllMocks()
	})

	afterAll(() => {
		process.env.NEXT_PUBLIC_BASE_N8N = originalEnv
	})

	test('retorna 401 sem autenticacao', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValueOnce(null)
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
		)
		const response = await POST(request)
		expect(response.status).toBe(401)
	})

	test('retorna 500 quando webhook nao configurado', async () => {
		delete process.env.NEXT_PUBLIC_BASE_N8N
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})

	test('retorna 400 para payload invalido', async () => {
		process.env.NEXT_PUBLIC_BASE_N8N = 'https://n8n.test/webhook'
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			{ invalid: true },
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})

	test('retorna 200 quando webhook responde ok', async () => {
		process.env.NEXT_PUBLIC_BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as typeof fetch
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
		)
		const response = await POST(request)
		const body = await readJson<{ success: boolean }>(response)
		expect(response.status).toBe(200)
		expect(body.success).toBe(true)
	})

	test('retorna status da falha do webhook', async () => {
		process.env.NEXT_PUBLIC_BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: false,
			status: 500,
			text: async () => 'erro',
		})) as unknown as typeof fetch
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})

	test('retorna 500 quando fetch lanca erro', async () => {
		process.env.NEXT_PUBLIC_BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => {
			throw new Error('network')
		}) as unknown as typeof fetch
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			validPayload,
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})
})
