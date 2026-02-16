/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Login.spec
 *
 * Visao geral:
 * - Casos de teste para Login.spec.
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
 * import * as modulo from "@/tests/app/api/auth/login.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { POST } from '@/app/api/auth/login/route'
import { createJsonRequest, readJson } from '@/tests/helpers/request'
import { fixtures } from '@/tests/helpers/fixtures'
import * as rateLimit from '@/lib/rate-limit'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
jest.mock('@/lib/password', () => ({
	verifyPassword: jest.fn(async () => true),
}))
jest.mock('@/lib/jwt', () => ({
	signAccessToken: jest.fn(() => 'access-token'),
	signRefreshToken: jest.fn(() => 'refresh-token'),
}))
jest.mock('@/lib/auth-cookies', () => ({
	setAuthCookies: jest.fn(),
}))
jest.mock('@/lib/tokens', () => ({
	hashToken: jest.fn(() => 'hashed-refresh'),
}))
jest.mock('@/lib/rate-limit', () => ({
	checkIpRateLimit: jest.fn(async () => ({ allowed: true })),
	getLoginAttempt: jest.fn(async () => null),
	recordLoginFailure: jest.fn(async () => undefined),
	recordLoginSuccess: jest.fn(async () => undefined),
}))
jest.mock('@/lib/security-log', () => ({
	logSecurityEvent: jest.fn(async () => undefined),
}))
describe('POST /api/auth/login', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(rateLimit.checkIpRateLimit as jest.Mock).mockResolvedValue({
			allowed: true,
		})
		;(rateLimit.getLoginAttempt as jest.Mock).mockResolvedValue(null)
	})
	test('bloqueia quando rate limit nega', async () => {
		const { checkIpRateLimit } = await import('@/lib/rate-limit')
		;(checkIpRateLimit as jest.Mock).mockResolvedValue({
			allowed: false,
			blockedUntil: new Date(),
		})
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(429)
	})
	test('retorna 400 para payload invalido', async () => {
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'invalid',
		})
		const response = await POST(request)
		expect(response.status).toBe(400)
	})
	test('retorna 401 para credenciais invalidas', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(401)
	})
	test('login bem sucedido', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...fixtures.user,
			emailVerified: new Date(),
			status: true,
		})
		;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
			id: 'rt_1',
		})
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		const body = await readJson<{
			message: string
		}>(response)
		expect(response.status).toBe(200)
		expect(body.message).toBe('Login realizado com sucesso.')
	})
	test('retorna 403 para email nao verificado', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...fixtures.user,
			emailVerified: null,
		})
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(403)
	})
	test('retorna 403 para usuario inativo', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...fixtures.user,
			emailVerified: new Date(),
			status: false,
		})
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(403)
	})
	test('retorna 401 quando senha invalida', async () => {
		const { verifyPassword } = await import('@/lib/password')
		;(verifyPassword as jest.Mock).mockResolvedValue(false)
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...fixtures.user,
			emailVerified: new Date(),
			status: true,
		})
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(401)
	})
	test('retorna 429 quando conta bloqueada por tentativas', async () => {
		const { getLoginAttempt } = await import('@/lib/rate-limit')
		;(getLoginAttempt as jest.Mock).mockResolvedValue({
			lockedUntil: new Date(Date.now() + 60 * 1000),
		})
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			...fixtures.user,
			emailVerified: new Date(),
			status: true,
		})
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(429)
	})
	test('retorna 500 quando prisma falha', async () => {
		;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
			new Error('db down'),
		)
		const request = createJsonRequest('http://localhost/api/auth/login', {
			email: 'henrique@teste.com',
			password: 'Senha@1234',
		})
		const response = await POST(request)
		expect(response.status).toBe(500)
	})
})
