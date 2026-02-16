/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Refresh.spec
 *
 * Visao geral:
 * - Casos de teste para Refresh.spec.
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
 * import * as modulo from "@/tests/app/api/auth/refresh.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/refresh/route'
import { createRequestWithCookies, readJson } from '@/tests/helpers/request'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/jwt', () => ({
	verifyRefreshToken: jest.fn(() => ({
		sub: 'usr_1',
		email: 'henrique@teste.com',
		name: 'Henrique',
	})),
	signAccessToken: jest.fn(() => 'access-token'),
	signRefreshToken: jest.fn(() => 'refresh-token'),
}))
jest.mock('@/lib/tokens', () => ({
	hashToken: jest.fn(() => 'hashed-refresh'),
}))
jest.mock('@/lib/auth-cookies', () => ({
	setAuthCookies: jest.fn(),
}))
describe('POST /api/auth/refresh', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('retorna 401 sem cookie', async () => {
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{},
		)
		const response = await POST(request)
		expect(response.status).toBe(401)
	})
	test('retorna 401 com token invalido', async () => {
		;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null)
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		const body = await readJson<{
			error: string
		}>(response)
		expect(response.status).toBe(401)
		expect(body.error).toBe('Refresh token inválido.')
	})
	test('retorna 401 quando refresh expirado', async () => {
		;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null)
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(401)
	})
	test('gera novos tokens', async () => {
		;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
			id: 'rt_1',
		})
		;(prisma.refreshToken.update as jest.Mock).mockResolvedValue({ id: 'rt_1' })
		;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 'rt_2' })
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(200)
	})
	test('retorna 500 quando verifyRefreshToken falha', async () => {
		const { verifyRefreshToken } = await import('@/lib/jwt')
		;(verifyRefreshToken as jest.Mock).mockImplementation(() => {
			throw new Error('token invalido')
		})
		const request = createRequestWithCookies(
			'http://localhost/api/auth/refresh',
			'POST',
			{ refresh_token: 'refresh-token' },
		)
		const response = await POST(request)
		expect(response.status).toBe(500)
	})
})
