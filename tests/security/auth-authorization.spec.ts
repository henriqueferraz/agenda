/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Testes de segurança: autenticação e autorização.
 * Valida que server actions e API routes rejeitam corretamente:
 * - Requisições sem token (não autenticado)
 * - Acesso a recursos de outro usuário (não autorizado)
 * - Tokens expirados/inválidos
 *
 * @example
 * npx jest tests/security/auth-authorization.spec.ts
 */
import prisma from '@/lib/prisma'

// Mock de autenticação — valor padrão: não autenticado (null)
const mockGetUserFromToken = jest.fn<Promise<{ id: string; email: string } | null>, unknown[]>(async () => null)
jest.mock('@/lib/auth', () => ({
	getUserFromToken: (...args: unknown[]) => mockGetUserFromToken(args[0]),
	getUserFromRequest: jest.fn(async () => null),
}))

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
	redirect: jest.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`)
	}),
}))

// Import server actions
import { deleteService } from '@/app/(panel)/dashboard/services/service/_actions/delete-service'
import { updateService } from '@/app/(panel)/dashboard/services/service/_actions/update-service'
import { deleteEmployee } from '@/app/(panel)/dashboard/services/employee/_actions/delete-employee'
import { deleteStopDay } from '@/app/(panel)/dashboard/schedule/stopday/_actions/delete-stopday'
import { createStopDay } from '@/app/(panel)/dashboard/schedule/stopday/_actions/create-stopday'

// Import API route handlers
import { POST as webhookPost } from '@/app/api/webhook/appointment/route'
import { createJsonRequest } from '@/tests/helpers/request'
import { _resetNonceStore } from '@/lib/webhook-nonce'

describe('Segurança - Autenticação', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockGetUserFromToken.mockResolvedValue(null)
		_resetNonceStore()
	})

	describe('Server Actions sem autenticação', () => {
		test('deleteService bloqueia sem auth', async () => {
			const result = await deleteService('srv_1')
			expect(result.success).toBe(false)
		})

		test('updateService bloqueia sem auth', async () => {
			const result = await updateService({ id: 'srv_1', name: 'Teste', price: 1000, duration: 30 })
			expect(result.success).toBe(false)
		})

		test('deleteEmployee bloqueia sem auth', async () => {
			const result = await deleteEmployee('emp_1')
			expect(result.success).toBe(false)
		})

		test('deleteStopDay retorna erro sem auth', async () => {
			const result = await deleteStopDay({ id: 'stop_1', userId: 'usr_1' })
			expect(result.success).toBe(false)
			expect(result.error).toContain('autenticado')
		})

		test('createStopDay retorna erro sem auth', async () => {
			const result = await createStopDay({
				motivation: 'Feriado Nacional',
				date: new Date('2026-12-25'),
				userId: 'usr_1',
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('autenticado')
		})
	})

	describe('API Routes sem autenticação', () => {
		test('webhook retorna 401 sem auth', async () => {
			const request = createJsonRequest(
				'http://localhost/api/webhook/appointment',
				[{ body: { name: 'teste' } }],
				{
					headers: {
						'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
						'x-webhook-nonce': crypto.randomUUID(),
					},
				},
			)
			const response = await webhookPost(request)
			expect(response.status).toBe(401)
		})
	})
})

describe('Segurança - Autorização (recurso de outro usuário)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Autenticado como usr_1
		mockGetUserFromToken.mockResolvedValue({ id: 'usr_1', email: 'user1@test.com' })
	})

	test('deleteService rejeita serviço de outro usuário', async () => {
		;(prisma.service.findUnique as jest.Mock).mockResolvedValue({
			id: 'srv_999',
			name: 'Serviço Alheio',
			UserId: 'usr_2', // Pertence a outro usuário
		})
		const result = await deleteService('srv_999')
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('updateService rejeita serviço de outro usuário', async () => {
		;(prisma.service.findUnique as jest.Mock).mockResolvedValue({
			id: 'srv_999',
			UserId: 'usr_2', // Pertence a outro usuário
		})
		const result = await updateService({
			id: 'srv_999',
			name: 'Tentativa',
			price: 1000,
			duration: 30,
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('deleteEmployee rejeita funcionário de outro usuário', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			id: 'emp_999',
			name: 'Funcionário Alheio',
			UserId: 'usr_2', // Pertence a outro usuário
		})
		const result = await deleteEmployee('emp_999')
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('deleteStopDay rejeita feriado com userId diferente', async () => {
		const result = await deleteStopDay({
			id: 'stop_999',
			userId: 'usr_2', // Tentativa de deletar feriado de outro usuário
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})

	test('createStopDay rejeita feriado com userId diferente', async () => {
		const result = await createStopDay({
			motivation: 'Feriado Falso',
			date: new Date('2026-12-25'),
			userId: 'usr_2', // Tentativa de criar para outro usuário
		})
		expect(result.success).toBe(false)
		expect(result.error).toContain('permissão')
	})
})

describe('Segurança - Proteção contra replay (API)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		_resetNonceStore()
		const { getUserFromRequest } = require('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValue({ id: 'usr_1' })
	})

	test('webhook rejeita timestamp expirado', async () => {
		const expired = String(Math.floor(Date.now() / 1000) - 10 * 60) // 10 min atrás
		const request = createJsonRequest(
			'http://localhost/api/webhook/appointment',
			[],
			{
				headers: {
					'x-webhook-timestamp': expired,
					'x-webhook-nonce': crypto.randomUUID(),
				},
			},
		)
		const response = await webhookPost(request)
		expect(response.status).toBe(400)
	})

	test('webhook rejeita nonce duplicado', async () => {
		process.env.BASE_N8N = 'https://n8n.test/webhook'
		global.fetch = jest.fn(async () => ({
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		})) as unknown as typeof fetch

		const validPayload = [{
			body: {
				type: 'create',
				name: 'Teste',
				email: 'teste@test.com',
				phone: '11999999999',
				token_called: null,
				reason: '',
				oldDate: '',
				oldTime: '',
				newDate: '',
				newTime: '',
				appointments: [{
					date: '2026-03-01',
					time: '10:00',
					services: [{
						id: 'srv_1',
						name: 'Corte',
						price: 5000,
						duration: 30,
						employee: { id: 'emp_1', name: 'João' },
					}],
				}],
			},
			webhookUrl: '',
			executionMode: 'production',
		}]

		const nonce = crypto.randomUUID()
		const makeRequest = () =>
			createJsonRequest(
				'http://localhost/api/webhook/appointment',
				validPayload,
				{
					headers: {
						'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
						'x-webhook-nonce': nonce,
					},
				},
			)

		const r1 = await webhookPost(makeRequest())
		expect(r1.status).toBe(200)

		const r2 = await webhookPost(makeRequest())
		expect(r2.status).toBe(400)
	})
})
