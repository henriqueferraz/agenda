/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Forgot Password.spec
 *
 * Visao geral:
 * - Casos de teste para Forgot Password.spec.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar contratos e comportamento esperado.
 * - Cobrir cenarios de sucesso e falha.
 * - Proteger contra regressao.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/tests/app/api/auth/forgot-password.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/forgot-password/route'
import { createJsonRequest } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/tokens', () => ({
	generateRandomToken: jest.fn(() => 'reset-token'),
	hashToken: jest.fn(() => 'hashed-reset'),
}))
jest.mock('@/lib/email', () => ({
	sendEmail: jest.fn(async () => undefined),
}))
jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))
describe('POST /api/auth/forgot-password', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 400 para email invalido', async () => {
		const request = createJsonRequest(
			'http://localhost/api/auth/forgot-password',
			{
				email: 'invalid',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('envia link quando usuario existe', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			email: 'henrique@teste.com',
		})
		;(prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
			id: 'prt_1',
		})
		const request = createJsonRequest(
			'http://localhost/api/auth/forgot-password',
			{
				email: 'henrique@teste.com',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 200 mesmo sem usuario', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest(
			'http://localhost/api/auth/forgot-password',
			{
				email: 'naoexiste@teste.com',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 500 quando email falha', async () => {
		const { sendEmail } = await import('@/lib/email')
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			email: 'henrique@teste.com',
		})
		;(sendEmail as jest.Mock).mockRejectedValue(new Error('smtp down'))
		const request = createJsonRequest(
			'http://localhost/api/auth/forgot-password',
			{
				email: 'henrique@teste.com',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})
})
