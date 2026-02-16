/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes do modulo de rate limiting (lib/rate-limit.ts).
 *
 * Cobre tres funcoes principais:
 * - checkIpRateLimit: bloqueio por IP usando upsert atomico
 * - recordLoginFailure: bloqueio progressivo por email
 * - recordLoginSuccess: reset de contador apos login bem-sucedido
 *
 * @example
 * npx jest tests/lib/rate-limit.spec.ts
 */
import prisma from '@/lib/prisma'
import {
	checkIpRateLimit,
	recordLoginFailure,
	recordLoginSuccess,
} from '@/lib/rate-limit'

describe('Rate limit - checkIpRateLimit (upsert atomico)', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('primeiro acesso de um IP novo: cria registro e permite', async () => {
		const now = new Date()
		;(prisma.ipRateLimit.upsert as jest.Mock).mockResolvedValue({
			ip: '192.168.1.1',
			count: 0,
			firstAttemptAt: now,
			blockedUntil: null,
		})
		;(prisma.ipRateLimit.update as jest.Mock).mockResolvedValue({})

		const result = await checkIpRateLimit('192.168.1.1')

		expect(result.allowed).toBe(true)
		expect(prisma.ipRateLimit.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { ip: '192.168.1.1' },
				create: expect.objectContaining({ ip: '192.168.1.1', count: 0 }),
				update: {},
			}),
		)
	})

	test('IP existente dentro da janela: incrementa count e permite', async () => {
		const recentTime = new Date(Date.now() - 2 * 60 * 1000) // 2 min atras
		;(prisma.ipRateLimit.upsert as jest.Mock).mockResolvedValue({
			ip: '192.168.1.1',
			count: 5,
			firstAttemptAt: recentTime,
			blockedUntil: null,
		})
		;(prisma.ipRateLimit.update as jest.Mock).mockResolvedValue({})

		const result = await checkIpRateLimit('192.168.1.1')

		expect(result.allowed).toBe(true)
		expect(prisma.ipRateLimit.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ count: 6 }),
			}),
		)
	})

	test('IP bloqueado retorna allowed=false com blockedUntil', async () => {
		const futureBlock = new Date(Date.now() + 10 * 60 * 1000) // 10 min no futuro
		;(prisma.ipRateLimit.upsert as jest.Mock).mockResolvedValue({
			ip: '192.168.1.1',
			count: 11,
			firstAttemptAt: new Date(),
			blockedUntil: futureBlock,
		})

		const result = await checkIpRateLimit('192.168.1.1')

		expect(result.allowed).toBe(false)
		expect(result.blockedUntil).toEqual(futureBlock)
		// Nao deve chamar update quando ja esta bloqueado
		expect(prisma.ipRateLimit.update).not.toHaveBeenCalled()
	})

	test('IP com janela expirada: reseta contador para 1', async () => {
		const oldTime = new Date(Date.now() - 15 * 60 * 1000) // 15 min atras (> janela de 10 min)
		;(prisma.ipRateLimit.upsert as jest.Mock).mockResolvedValue({
			ip: '192.168.1.1',
			count: 8,
			firstAttemptAt: oldTime,
			blockedUntil: null,
		})
		;(prisma.ipRateLimit.update as jest.Mock).mockResolvedValue({})

		const result = await checkIpRateLimit('192.168.1.1')

		expect(result.allowed).toBe(true)
		expect(prisma.ipRateLimit.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ count: 1 }),
			}),
		)
	})

	test('IP que excede limite: bloqueia com blockedUntil', async () => {
		const recentTime = new Date(Date.now() - 2 * 60 * 1000)
		;(prisma.ipRateLimit.upsert as jest.Mock).mockResolvedValue({
			ip: '192.168.1.1',
			count: 10, // proximo sera 11, que excede IP_MAX_ATTEMPTS (10)
			firstAttemptAt: recentTime,
			blockedUntil: null,
		})
		;(prisma.ipRateLimit.update as jest.Mock).mockResolvedValue({})

		const result = await checkIpRateLimit('192.168.1.1')

		expect(result.allowed).toBe(false)
		expect(result.blockedUntil).toBeInstanceOf(Date)
		expect(prisma.ipRateLimit.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					count: 11,
					blockedUntil: expect.any(Date),
				}),
			}),
		)
	})
})

describe('Rate limit - tentativas progressivas de login', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	test('recordLoginFailure cria tentativa quando nao existe', async () => {
		;(prisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue(null)
		;(prisma.loginAttempt.create as jest.Mock).mockResolvedValue({ id: 'la_1' })
		const result = await recordLoginFailure('user@teste.com')
		expect(result).toBeNull()
	})

	test('recordLoginFailure aplica bloqueio progressivo', async () => {
		;(prisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue({
			id: 'la_1',
			count: 4,
			lockedUntil: null,
		})
		;(prisma.loginAttempt.update as jest.Mock).mockResolvedValue({ id: 'la_1' })
		const lockedUntil = await recordLoginFailure('user@teste.com')
		expect(lockedUntil).toBeInstanceOf(Date)
	})

	test('recordLoginSuccess zera tentativas', async () => {
		;(prisma.loginAttempt.findFirst as jest.Mock).mockResolvedValue({
			id: 'la_1',
		})
		;(prisma.loginAttempt.update as jest.Mock).mockResolvedValue({ id: 'la_1' })
		await recordLoginSuccess('user@teste.com')
		expect(prisma.loginAttempt.update).toHaveBeenCalled()
	})
})
