/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/global-messaging.ts.
 * Valida payload padronizado, autenticação via x-global-auth,
 * buildPayload e sendGlobalMessage.
 *
 * @example
 * npx jest tests/lib/global-messaging.spec.ts
 */
import {
	sendGlobalMessage,
	buildPayload,
	GLOBAL_AUTH_HEADER,
} from '@/lib/global-messaging'
import type {
	GlobalMessagePayload,
	GlobalMessageParams,
} from '@/lib/global-messaging'
import prismaMock from '@/lib/prisma'

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('global-messaging', () => {
	const originalGlobalN8n = process.env.GLOBAL_N8N
	const originalGlobalSecret = process.env.GLOBAL_WEBHOOK_SECRET

	beforeEach(() => {
		jest.clearAllMocks()
		process.env.GLOBAL_N8N = 'https://n8n.test.com/webhook/global'
		process.env.GLOBAL_WEBHOOK_SECRET = 'test-global-secret-64chars'
		mockFetch.mockResolvedValue({ ok: true, status: 200 })
	})

	afterAll(() => {
		process.env.GLOBAL_N8N = originalGlobalN8n
		process.env.GLOBAL_WEBHOOK_SECRET = originalGlobalSecret
	})

	describe('GLOBAL_AUTH_HEADER', () => {
		test('header é x-global-auth', () => {
			expect(GLOBAL_AUTH_HEADER).toBe('x-global-auth')
		})
	})

	describe('buildPayload', () => {
		const baseParams: GlobalMessageParams = {
			type: 'reminder_24h',
			userId: 'usr_1',
			channel: 'whatsapp',
		}

		test('gera payload com todos os 22 campos presentes', () => {
			const payload = buildPayload(baseParams, 'token-123')
			const keys = Object.keys(payload)
			expect(keys).toHaveLength(22)
		})

		test('campos não informados são preenchidos com string vazia', () => {
			const payload = buildPayload(baseParams, 'token-123')

			expect(payload.type).toBe('reminder_24h')
			expect(payload.token_called).toBe('token-123')
			expect(payload.channel).toBe('whatsapp')
			expect(payload.clientName).toBe('')
			expect(payload.clientPhone).toBe('')
			expect(payload.clientEmail).toBe('')
			expect(payload.appointmentDate).toBe('')
			expect(payload.appointmentTime).toBe('')
			expect(payload.serviceName).toBe('')
			expect(payload.servicePrice).toBe('')
			expect(payload.serviceDuration).toBe('')
			expect(payload.employeeName).toBe('')
			expect(payload.oldDate).toBe('')
			expect(payload.oldTime).toBe('')
			expect(payload.newDate).toBe('')
			expect(payload.newTime).toBe('')
			expect(payload.reason).toBe('')
			expect(payload.managementLink).toBe('')
			expect(payload.message).toBe('')
			expect(payload.professionalName).toBe('')
			expect(payload.promotionCode).toBe('')
			expect(payload.promotionExpiry).toBe('')
		})

		test('preenche campos informados corretamente', () => {
			const params: GlobalMessageParams = {
				type: 'client_rescheduled',
				userId: 'usr_1',
				channel: 'whatsapp',
				clientName: 'Maria Souza',
				clientPhone: '5511988887777',
				clientEmail: 'maria@email.com',
				appointmentDate: '2026-02-22',
				appointmentTime: '14:00',
				serviceName: 'Escova Progressiva',
				servicePrice: '15000',
				serviceDuration: '120',
				employeeName: 'Ana',
				oldDate: '2026-02-20',
				oldTime: '10:00',
				newDate: '2026-02-22',
				newTime: '14:00',
				reason: 'Cliente solicitou novo horário',
				managementLink: 'https://site.com/gerenciar/abc123',
				message: 'Reagendamento confirmado',
				professionalName: 'Studio Hair',
				promotionCode: 'DESC10',
				promotionExpiry: '2026-03-01',
			}

			const payload = buildPayload(params, 'empresa-token')

			expect(payload.type).toBe('client_rescheduled')
			expect(payload.token_called).toBe('empresa-token')
			expect(payload.channel).toBe('whatsapp')
			expect(payload.clientName).toBe('Maria Souza')
			expect(payload.clientPhone).toBe('5511988887777')
			expect(payload.clientEmail).toBe('maria@email.com')
			expect(payload.appointmentDate).toBe('2026-02-22')
			expect(payload.appointmentTime).toBe('14:00')
			expect(payload.serviceName).toBe('Escova Progressiva')
			expect(payload.servicePrice).toBe('15000')
			expect(payload.serviceDuration).toBe('120')
			expect(payload.employeeName).toBe('Ana')
			expect(payload.oldDate).toBe('2026-02-20')
			expect(payload.oldTime).toBe('10:00')
			expect(payload.newDate).toBe('2026-02-22')
			expect(payload.newTime).toBe('14:00')
			expect(payload.reason).toBe('Cliente solicitou novo horário')
			expect(payload.managementLink).toBe('https://site.com/gerenciar/abc123')
			expect(payload.message).toBe('Reagendamento confirmado')
			expect(payload.professionalName).toBe('Studio Hair')
			expect(payload.promotionCode).toBe('DESC10')
			expect(payload.promotionExpiry).toBe('2026-03-01')
		})

		test('token_called vazio quando não encontrado', () => {
			const payload = buildPayload(baseParams, '')
			expect(payload.token_called).toBe('')
		})

		test('todos os valores são strings', () => {
			const params: GlobalMessageParams = {
				type: 'reminder_7d',
				userId: 'usr_1',
				channel: 'both',
				clientName: 'João',
				servicePrice: '5000',
				serviceDuration: '30',
			}
			const payload = buildPayload(params, 'token')

			Object.values(payload).forEach((value) => {
				expect(typeof value).toBe('string')
			})
		})

		test('diferentes tipos de mensagem são aceitos', () => {
			const types: GlobalMessageParams['type'][] = [
				'reminder_7d', 'reminder_24h', 'reminder_2h',
				'custom_individual', 'custom_bulk', 'unavailability',
				'management_link', 'client_cancelled', 'client_rescheduled',
				'post_appointment', 'reengagement', 'birthday',
				'feedback_request', 'promotion', 'new_service',
				'seasonal', 'coupon', 'business_update',
				'holiday_notice', 'new_employee',
				'payment_confirmed', 'payment_reminder',
				'waitlist_available', 'loyalty_reward',
			]

			types.forEach((type) => {
				const payload = buildPayload({ type, userId: 'usr_1', channel: 'whatsapp' }, 'token')
				expect(payload.type).toBe(type)
			})
		})
	})

	describe('sendGlobalMessage', () => {
		beforeEach(() => {
			;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ token_called: 'empresa-token-123' })
		})

		test('envia payload padronizado com todos os campos', async () => {
			await sendGlobalMessage({
				type: 'reminder_24h',
				userId: 'usr_1',
				channel: 'whatsapp',
				clientName: 'Maria',
				clientPhone: '5511988887777',
				message: 'Lembrete',
			})

			expect(mockFetch).toHaveBeenCalledTimes(1)

			const [url, options] = mockFetch.mock.calls[0]
			expect(url).toBe('https://n8n.test.com/webhook/global')

			const body: GlobalMessagePayload = JSON.parse(options.body)
			expect(Object.keys(body)).toHaveLength(22)
			expect(body.type).toBe('reminder_24h')
			expect(body.clientName).toBe('Maria')
			expect(body.clientPhone).toBe('5511988887777')
			expect(body.message).toBe('Lembrete')
			expect(body.oldDate).toBe('')
			expect(body.promotionCode).toBe('')
		})

		test('inclui header x-global-auth com GLOBAL_WEBHOOK_SECRET', async () => {
			await sendGlobalMessage({
				type: 'custom_individual',
				userId: 'usr_1',
				channel: 'whatsapp',
				message: 'Teste',
			})

			const [, options] = mockFetch.mock.calls[0]
			expect(options.headers['x-global-auth']).toBe('test-global-secret-64chars')
			expect(options.headers['Content-Type']).toBe('application/json')
		})

		test('busca token_called do banco via userId', async () => {
			await sendGlobalMessage({
				type: 'birthday',
				userId: 'usr_abc',
				channel: 'whatsapp',
				clientName: 'João',
				message: 'Feliz aniversário!',
			})

			expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'usr_abc' },
				select: { token_called: true },
			})

			const body: GlobalMessagePayload = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(body.token_called).toBe('empresa-token-123')
		})

		test('token_called fica vazio se não encontrado no banco', async () => {
			;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

			await sendGlobalMessage({
				type: 'reengagement',
				userId: 'usr_inexistente',
				channel: 'whatsapp',
				message: 'Volta!',
			})

			const body: GlobalMessagePayload = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(body.token_called).toBe('')
		})

		test('token_called fica vazio se Prisma lançar erro', async () => {
			;(prismaMock.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB down'))

			await sendGlobalMessage({
				type: 'promotion',
				userId: 'usr_1',
				channel: 'whatsapp',
				message: 'Promoção!',
			})

			const body: GlobalMessagePayload = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(body.token_called).toBe('')
		})

		test('não envia se GLOBAL_N8N não está configurado', async () => {
			delete process.env.GLOBAL_N8N

			await sendGlobalMessage({
				type: 'reminder_7d',
				userId: 'usr_1',
				channel: 'whatsapp',
			})

			expect(mockFetch).not.toHaveBeenCalled()
		})

		test('não envia se GLOBAL_WEBHOOK_SECRET não está configurado', async () => {
			delete process.env.GLOBAL_WEBHOOK_SECRET
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

			await sendGlobalMessage({
				type: 'reminder_7d',
				userId: 'usr_1',
				channel: 'whatsapp',
			})

			expect(mockFetch).not.toHaveBeenCalled()
			expect(consoleSpy).toHaveBeenCalledWith(
				'[GLOBAL-MSG] GLOBAL_WEBHOOK_SECRET não está configurado',
			)
			consoleSpy.mockRestore()
		})

		test('loga erro HTTP silenciosamente sem interromper', async () => {
			mockFetch.mockResolvedValue({ ok: false, status: 500 })
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

			await sendGlobalMessage({
				type: 'custom_individual',
				userId: 'usr_1',
				channel: 'whatsapp',
				message: 'Teste',
			})

			expect(consoleSpy).toHaveBeenCalledWith(
				'[GLOBAL-MSG] Erro HTTP ao enviar custom_individual:',
				{ status: 500 },
			)
			consoleSpy.mockRestore()
		})

		test('loga erro de rede silenciosamente sem interromper', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'))
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

			await sendGlobalMessage({
				type: 'unavailability',
				userId: 'usr_1',
				channel: 'whatsapp',
				message: 'Indisponível',
			})

			expect(consoleSpy).toHaveBeenCalledWith(
				'[GLOBAL-MSG] Erro de rede ao enviar unavailability:',
				{ error: 'Network error' },
			)
			consoleSpy.mockRestore()
		})

		test('payload type create para reminder_24h', async () => {
			await sendGlobalMessage({
				type: 'reminder_24h',
				userId: 'usr_1',
				channel: 'whatsapp',
				clientName: 'Maria Souza',
				clientPhone: '5511988887777',
				clientEmail: 'maria@email.com',
				appointmentDate: '2026-02-20',
				appointmentTime: '10:00',
				serviceName: 'Escova Progressiva',
				employeeName: 'Ana',
				managementLink: 'https://site.com/gerenciar/abc',
				message: 'Seu agendamento é amanhã!',
			})

			const body: GlobalMessagePayload = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(body.type).toBe('reminder_24h')
			expect(body.clientName).toBe('Maria Souza')
			expect(body.appointmentDate).toBe('2026-02-20')
			expect(body.managementLink).toBe('https://site.com/gerenciar/abc')
			expect(body.oldDate).toBe('')
			expect(body.reason).toBe('')
			expect(body.promotionCode).toBe('')
		})

		test('payload type client_rescheduled com oldDate/newDate', async () => {
			await sendGlobalMessage({
				type: 'client_rescheduled',
				userId: 'usr_1',
				channel: 'whatsapp',
				clientName: 'Henrique',
				clientPhone: '5521999990000',
				oldDate: '2026-02-20',
				oldTime: '10:00',
				newDate: '2026-02-22',
				newTime: '14:00',
				reason: 'Cliente reagendou',
				message: 'Reagendamento feito',
			})

			const body: GlobalMessagePayload = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(body.type).toBe('client_rescheduled')
			expect(body.oldDate).toBe('2026-02-20')
			expect(body.oldTime).toBe('10:00')
			expect(body.newDate).toBe('2026-02-22')
			expect(body.newTime).toBe('14:00')
			expect(body.reason).toBe('Cliente reagendou')
		})

		test('payload type promotion com promotionCode e promotionExpiry', async () => {
			await sendGlobalMessage({
				type: 'promotion',
				userId: 'usr_1',
				channel: 'both',
				clientName: 'João',
				clientPhone: '5511999998888',
				clientEmail: 'joao@email.com',
				message: '20% de desconto!',
				promotionCode: 'DESC20',
				promotionExpiry: '2026-03-01',
				professionalName: 'Studio Hair',
			})

			const body: GlobalMessagePayload = JSON.parse(mockFetch.mock.calls[0][1].body)
			expect(body.type).toBe('promotion')
			expect(body.channel).toBe('both')
			expect(body.promotionCode).toBe('DESC20')
			expect(body.promotionExpiry).toBe('2026-03-01')
			expect(body.professionalName).toBe('Studio Hair')
			expect(body.appointmentDate).toBe('')
		})

		test('método POST e Content-Type application/json', async () => {
			await sendGlobalMessage({
				type: 'birthday',
				userId: 'usr_1',
				channel: 'whatsapp',
				message: 'Parabéns!',
			})

			const [, options] = mockFetch.mock.calls[0]
			expect(options.method).toBe('POST')
			expect(options.headers['Content-Type']).toBe('application/json')
		})

		test('inclui AbortController com signal', async () => {
			await sendGlobalMessage({
				type: 'new_employee',
				userId: 'usr_1',
				channel: 'whatsapp',
				message: 'Novo profissional!',
			})

			const [, options] = mockFetch.mock.calls[0]
			expect(options.signal).toBeDefined()
		})
	})
})
