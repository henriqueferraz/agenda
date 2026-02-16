/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Change Password.spec
 *
 * Visao geral:
 * - Casos de teste para Change Password.spec.
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
 * import * as modulo from "@/tests/app/api/auth/change-password.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/change-password/route'
import { createJsonRequest } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/auth', () => ({
	getUserFromRequest: jest.fn(),
}))
jest.mock('@/lib/password', () => ({
	verifyPassword: jest.fn(async () => true),
	hashPassword: jest.fn(async () => 'hashed-password'),
}))
jest.mock('@/lib/password-policy', () => ({
	validatePasswordPolicy: jest.fn(() => ({ valid: true })),
}))
jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))
jest.mock('@/lib/auth-cookies', () => ({
	clearAuthCookies: jest.fn(),
}))
describe('POST /api/auth/change-password', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 401 quando nao autenticado', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest(
			'http://localhost/api/auth/change-password',
			{
				currentPassword: 'Senha@1234',
				newPassword: 'Senha@5678',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(401)
	})
	test('troca senha com sucesso', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			email: 'henrique@teste.com',
		})
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			password_hash: 'old-hash',
		})
		;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({
			count: 1,
		})
		const request = createJsonRequest(
			'http://localhost/api/auth/change-password',
			{
				currentPassword: 'Senha@1234',
				newPassword: 'Senha@5678',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 400 quando senha atual invalida', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		const { verifyPassword } = await import('@/lib/password')
		;(getUserFromRequest as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			email: 'henrique@teste.com',
		})
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			password_hash: 'old-hash',
		})
		;(verifyPassword as jest.Mock).mockResolvedValue(false)
		const request = createJsonRequest(
			'http://localhost/api/auth/change-password',
			{
				currentPassword: 'Senha@1234',
				newPassword: 'Senha@5678',
			},
		)
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
})
