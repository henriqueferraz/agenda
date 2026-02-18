/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Testes para POST /api/cron/reminders (F-03).
 * Valida autenticação, envio de lembretes dentro da janela,
 * respeito à MessageConfig, prevenção de duplicatas e tratamento de erros.
 *
 * @example
 * npx jest tests/app/api/cron/reminders.spec.ts
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/cron/reminders/route'
import { createJsonRequest, readJson } from '@/tests/helpers/request'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSendGlobalMessage = jest.fn<Promise<void>, any[]>(async () => undefined)
jest.mock('@/lib/global-messaging', () => ({
	sendGlobalMessage: (params: unknown) => mockSendGlobalMessage(params),
}))

const VALID_AUTH_TOKEN = 'test-cron-token'

beforeAll(() => {
	process.env.WEBHOOK_AUTH_TOKEN = VALID_AUTH_TOKEN
	process.env.NEXT_PUBLIC_APP_URL = 'https://testapp.com'
})

/**
 * Cria uma NextRequest com o header de autenticação do cron.
 */
const createCronRequest = (token?: string) => {
	const headers: Record<string, string> = {}
	if (token) {
		headers['x-webhook-auth'] = token
	}
	return createJsonRequest(
		'http://localhost:3000/api/cron/reminders',
		{},
		{ headers },
	)
}

/**
 * Helper para criar um agendamento mock na janela de 24h (amanhã).
 */
const createMockAppointment = (overrides: Record<string, unknown> = {}) => {
	const tomorrow = new Date()
	tomorrow.setDate(tomorrow.getDate() + 1)
	tomorrow.setHours(0, 0, 0, 0)

	return {
		id: 'apt_1',
		name: 'Maria',
		email: 'maria@teste.com',
		phone: '5511999998888',
		appointmentDate: tomorrow,
		time: new Date().toTimeString().slice(0, 5),
		status: 'confirmed',
		managementToken: 'mgmt_abc123',
		service: { name: 'Corte', price: 5000, duration: 30 },
		employee: { name: 'João' },
		user: {
			id: 'usr_1',
			name: 'Profissional',
			messageConfig: null,
		},
		reminderLogs: [],
		...overrides,
	}
}

describe('API Route - POST /api/cron/reminders (F-03)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('retorna 401 sem header de autenticação', async () => {
		const req = createCronRequest()
		const res = await POST(req)
		const json = await readJson(res)

		expect(res.status).toBe(401)
		expect(json).toEqual({ error: 'Não autorizado.' })
	})

	test('retorna 401 com token inválido', async () => {
		const req = createCronRequest('wrong-token')
		const res = await POST(req)

		expect(res.status).toBe(401)
	})

	test('processa com sucesso sem agendamentos', async () => {
		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])

		const req = createCronRequest(VALID_AUTH_TOKEN)
		const res = await POST(req)
		const json = await readJson<{ success: boolean; processed: number }>(res)

		expect(res.status).toBe(200)
		expect(json.success).toBe(true)
		expect(json.processed).toBe(0)
	})

	test('envia lembrete 24h dentro da janela', async () => {
		const now = new Date()
		const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
		appointmentDate.setMilliseconds(0)
		appointmentDate.setSeconds(0)

		const dateOnly = new Date(appointmentDate)
		dateOnly.setUTCHours(0, 0, 0, 0)

		const hours = appointmentDate.getUTCHours()
		const spHours = hours - 3 < 0 ? hours - 3 + 24 : hours - 3
		const time = `${String(spHours).padStart(2, '0')}:${String(appointmentDate.getUTCMinutes()).padStart(2, '0')}`

		const apt = createMockAppointment({
			appointmentDate: dateOnly,
			time,
		})

		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])
		;(prisma.reminderLog.create as jest.Mock).mockResolvedValue({ id: 'log_1' })

		const req = createCronRequest(VALID_AUTH_TOKEN)
		const res = await POST(req)
		const json = await readJson<{ success: boolean; sent: number }>(res)

		expect(res.status).toBe(200)
		expect(json.success).toBe(true)
		expect(json.sent).toBeGreaterThanOrEqual(1)
		expect(mockSendGlobalMessage).toHaveBeenCalled()
		expect(prisma.reminderLog.create).toHaveBeenCalled()
	})

	test('pula lembrete já enviado (ReminderLog)', async () => {
		const now = new Date()
		const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
		const dateOnly = new Date(appointmentDate)
		dateOnly.setUTCHours(0, 0, 0, 0)

		const hours = appointmentDate.getUTCHours()
		const spHours = hours - 3 < 0 ? hours - 3 + 24 : hours - 3
		const time = `${String(spHours).padStart(2, '0')}:${String(appointmentDate.getUTCMinutes()).padStart(2, '0')}`

		const apt = createMockAppointment({
			appointmentDate: dateOnly,
			time,
			reminderLogs: [{ type: 'reminder_24h' }],
		})

		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

		const req = createCronRequest(VALID_AUTH_TOKEN)
		const res = await POST(req)
		const json = await readJson<{ success: boolean; sent: number }>(res)

		expect(res.status).toBe(200)
		expect(json.sent).toBeLessThanOrEqual(json.sent)
		expect(mockSendGlobalMessage).not.toHaveBeenCalledWith(
			expect.objectContaining({ type: 'reminder_24h' }),
		)
	})

	test('respeita MessageConfig com reminder24h desativado', async () => {
		const now = new Date()
		const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
		const dateOnly = new Date(appointmentDate)
		dateOnly.setUTCHours(0, 0, 0, 0)

		const hours = appointmentDate.getUTCHours()
		const spHours = hours - 3 < 0 ? hours - 3 + 24 : hours - 3
		const time = `${String(spHours).padStart(2, '0')}:${String(appointmentDate.getUTCMinutes()).padStart(2, '0')}`

		const apt = createMockAppointment({
			appointmentDate: dateOnly,
			time,
			user: {
				id: 'usr_1',
				name: 'Profissional',
				messageConfig: {
					reminder7d: true,
					reminder24h: false,
					reminder2h: true,
					reminderChannel: 'email',
				},
			},
		})

		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])

		const req = createCronRequest(VALID_AUTH_TOKEN)
		await POST(req)

		const calls = mockSendGlobalMessage.mock.calls
		const sent24h = calls.some(
			(c: unknown[]) =>
				(c[0] as Record<string, unknown>)?.type === 'reminder_24h',
		)
		expect(sent24h).toBe(false)
	})

	test('usa canal da MessageConfig', async () => {
		const now = new Date()
		const appointmentDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)
		const dateOnly = new Date(appointmentDate)
		dateOnly.setUTCHours(0, 0, 0, 0)

		const hours = appointmentDate.getUTCHours()
		const spHours = hours - 3 < 0 ? hours - 3 + 24 : hours - 3
		const time = `${String(spHours).padStart(2, '0')}:${String(appointmentDate.getUTCMinutes()).padStart(2, '0')}`

		const apt = createMockAppointment({
			appointmentDate: dateOnly,
			time,
			user: {
				id: 'usr_1',
				name: 'Profissional',
				messageConfig: {
					reminder7d: true,
					reminder24h: true,
					reminder2h: true,
					reminderChannel: 'email',
				},
			},
		})

		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])
		;(prisma.reminderLog.create as jest.Mock).mockResolvedValue({ id: 'log_1' })

		const req = createCronRequest(VALID_AUTH_TOKEN)
		await POST(req)

		if (mockSendGlobalMessage.mock.calls.length > 0) {
			const firstArg = mockSendGlobalMessage.mock.calls[0] as unknown as unknown[]
			const params = firstArg[0] as Record<string, unknown>
			expect(params.channel).toBe('email')
		}
	})

	test('inclui managementLink no payload', async () => {
		const now = new Date()
		const appointmentDate = new Date(now.getTime() + 2 * 60 * 60 * 1000)
		const dateOnly = new Date(appointmentDate)
		dateOnly.setUTCHours(0, 0, 0, 0)

		const hours = appointmentDate.getUTCHours()
		const spHours = hours - 3 < 0 ? hours - 3 + 24 : hours - 3
		const time = `${String(spHours).padStart(2, '0')}:${String(appointmentDate.getUTCMinutes()).padStart(2, '0')}`

		const apt = createMockAppointment({
			appointmentDate: dateOnly,
			time,
			managementToken: 'token_xyz_123',
		})

		;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([apt])
		;(prisma.reminderLog.create as jest.Mock).mockResolvedValue({ id: 'log_1' })

		const req = createCronRequest(VALID_AUTH_TOKEN)
		await POST(req)

		if (mockSendGlobalMessage.mock.calls.length > 0) {
			const firstArg = mockSendGlobalMessage.mock.calls[0] as unknown as unknown[]
			const params = firstArg[0] as Record<string, unknown>
			expect(params.managementLink).toContain('/agendamento/gerenciar/token_xyz_123')
		}
	})

	test('retorna 500 em erro inesperado', async () => {
		;(prisma.appointment.findMany as jest.Mock).mockRejectedValue(
			new Error('DB error'),
		)

		const req = createCronRequest(VALID_AUTH_TOKEN)
		const res = await POST(req)
		const json = await readJson(res)

		expect(res.status).toBe(500)
		expect(json).toEqual({ error: 'Erro interno ao processar lembretes.' })
	})
})
