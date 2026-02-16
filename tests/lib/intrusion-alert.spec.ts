/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/intrusion-alert.ts.
 * Valida detecção de intrusão, registro de bloqueios e sistema de cooldown.
 *
 * @example
 * npx jest tests/lib/intrusion-alert.spec.ts
 */
import prisma from '@/lib/prisma'
import {
	checkAndAlertIntrusion,
	countRecentBlocks,
	recordIpBlock,
	_resetAlertCooldowns,
} from '@/lib/intrusion-alert'

jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))

import { logSecurityEvent } from '@/lib/security-log'

describe('intrusion-alert', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		_resetAlertCooldowns()
	})

	describe('countRecentBlocks', () => {
		test('retorna contagem de bloqueios recentes', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(5)
			const count = await countRecentBlocks('10.0.0.1')
			expect(count).toBe(5)
			expect(prisma.securityLog.count).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						ip: '10.0.0.1',
						action: 'IP_RATE_LIMIT_BLOCKED',
					}),
				}),
			)
		})

		test('retorna 0 quando não há bloqueios', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(0)
			const count = await countRecentBlocks('10.0.0.2')
			expect(count).toBe(0)
		})
	})

	describe('recordIpBlock', () => {
		test('registra bloqueio no SecurityLog', async () => {
			await recordIpBlock('10.0.0.1', '/api/auth/login')
			expect(logSecurityEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					ip: '10.0.0.1',
					action: 'IP_RATE_LIMIT_BLOCKED',
					metadata: expect.objectContaining({ route: '/api/auth/login' }),
				}),
			)
		})
	})

	describe('checkAndAlertIntrusion', () => {
		test('não emite alerta com poucos bloqueios', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(1)
			const alerted = await checkAndAlertIntrusion('10.0.0.3', '/api/auth/login')
			expect(alerted).toBe(false)
			// Deve registrar o bloqueio atual
			expect(logSecurityEvent).toHaveBeenCalledWith(
				expect.objectContaining({ action: 'IP_RATE_LIMIT_BLOCKED' }),
			)
			// Não deve registrar alerta de intrusão
			expect(logSecurityEvent).not.toHaveBeenCalledWith(
				expect.objectContaining({ action: 'INTRUSION_ALERT' }),
			)
		})

		test('emite alerta quando threshold atingido (3+ bloqueios)', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(3)
			const alerted = await checkAndAlertIntrusion('10.0.0.4', '/api/auth/login')
			expect(alerted).toBe(true)
			// Deve registrar o alerta de intrusão
			expect(logSecurityEvent).toHaveBeenCalledWith(
				expect.objectContaining({
					ip: '10.0.0.4',
					action: 'INTRUSION_ALERT',
					metadata: expect.objectContaining({
						blocksInLastHour: 3,
						lastRoute: '/api/auth/login',
					}),
				}),
			)
		})

		test('emite alerta para 5+ bloqueios', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(5)
			const alerted = await checkAndAlertIntrusion('10.0.0.5', '/api/webhook')
			expect(alerted).toBe(true)
		})

		test('cooldown impede alertas duplicados para mesmo IP', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(3)

			// Primeiro alerta: emite
			const first = await checkAndAlertIntrusion('10.0.0.6', '/api/auth/login')
			expect(first).toBe(true)

			// Segundo alerta (mesmo IP, em cooldown): não emite
			const second = await checkAndAlertIntrusion('10.0.0.6', '/api/auth/login')
			expect(second).toBe(false)
		})

		test('IPs diferentes não compartilham cooldown', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(3)

			const first = await checkAndAlertIntrusion('10.0.0.7', '/api/auth/login')
			expect(first).toBe(true)

			const second = await checkAndAlertIntrusion('10.0.0.8', '/api/auth/login')
			expect(second).toBe(true)
		})

		test('reset de cooldowns permite novo alerta', async () => {
			;(prisma.securityLog.count as jest.Mock).mockResolvedValue(3)

			await checkAndAlertIntrusion('10.0.0.9', '/api/auth/login')
			_resetAlertCooldowns()

			const result = await checkAndAlertIntrusion('10.0.0.9', '/api/auth/login')
			expect(result).toBe(true)
		})

		test('trata erros sem lançar exceção', async () => {
			;(prisma.securityLog.count as jest.Mock).mockRejectedValue(new Error('DB error'))
			const result = await checkAndAlertIntrusion('10.0.0.10', '/api/test')
			expect(result).toBe(false)
		})
	})
})
