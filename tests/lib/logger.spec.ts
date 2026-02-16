/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/logger.ts.
 * Valida sanitização de dados sensíveis e comportamento por ambiente.
 *
 * @example
 * npx jest tests/lib/logger.spec.ts
 */
import { sanitizeData, logger } from '@/lib/logger'

describe('logger', () => {
	describe('sanitizeData', () => {
		test('mascara password completamente', () => {
			const result = sanitizeData({ password: 'minha-senha-123' })
			expect(result.password).toBe('[REDACTED]')
		})

		test('mascara token completamente', () => {
			const result = sanitizeData({ token: 'jwt-token-aqui' })
			expect(result.token).toBe('[REDACTED]')
		})

		test('mascara secret completamente', () => {
			const result = sanitizeData({ secret: 'super-secret' })
			expect(result.secret).toBe('[REDACTED]')
		})

		test('mascara authorization completamente', () => {
			const result = sanitizeData({ authorization: 'Bearer xyz' })
			expect(result.authorization).toBe('[REDACTED]')
		})

		test('mascara cookie completamente', () => {
			const result = sanitizeData({ cookie: 'session=abc123' })
			expect(result.cookie).toBe('[REDACTED]')
		})

		test('mascara email parcialmente preservando domínio', () => {
			const result = sanitizeData({ email: 'usuario@example.com' })
			expect(result.email).toBe('us***@example.com')
		})

		test('mascara email curto', () => {
			const result = sanitizeData({ email: 'a@b.com' })
			expect(result.email).toBe('a***@b.com')
		})

		test('mascara CPF preservando 3 primeiros dígitos', () => {
			const result = sanitizeData({ cpf: '12345678901' })
			expect(result.cpf).toBe('123********')
		})

		test('mascara CNPJ preservando 3 primeiros dígitos', () => {
			const result = sanitizeData({ cnpj: '12345678000199' })
			expect(result.cnpj).toBe('123***********')
		})

		test('mascara phone preservando DDD e últimos 2 dígitos', () => {
			const result = sanitizeData({ phone: '11999887766' })
			expect(result.phone).toBe('11*******66')
		})

		test('mascara telefone formatado', () => {
			const result = sanitizeData({ telefone: '(11) 99988-7766' })
			expect(result.telefone).toBe('11*******66')
		})

		test('não altera campos não sensíveis', () => {
			const result = sanitizeData({
				name: 'João',
				userId: 'usr_123',
				appointmentId: 'apt_456',
			})
			expect(result.name).toBe('João')
			expect(result.userId).toBe('usr_123')
			expect(result.appointmentId).toBe('apt_456')
		})

		test('sanitiza objetos aninhados', () => {
			const result = sanitizeData({
				user: { email: 'teste@mail.com', password: 'abc' },
			})
			const user = result.user as Record<string, unknown>
			expect(user.email).toBe('te***@mail.com')
			expect(user.password).toBe('[REDACTED]')
		})

		test('sanitiza arrays', () => {
			const result = sanitizeData({
				users: [
					{ email: 'a@b.com', name: 'Ana' },
					{ email: 'c@d.com', name: 'Carlos' },
				],
			})
			const users = result.users as Array<Record<string, unknown>>
			expect(users[0].email).toBe('a***@b.com')
			expect(users[0].name).toBe('Ana')
			expect(users[1].email).toBe('c***@d.com')
		})

		test('preserva null e undefined', () => {
			const result = sanitizeData({ email: null as unknown as string, name: undefined as unknown as string })
			expect(result.email).toBeNull()
			expect(result.name).toBeUndefined()
		})

		test('limita profundidade de recursão', () => {
			const deep = { a: { b: { c: { d: { e: { f: { g: 'deep' } } } } } } }
			const result = sanitizeData(deep)
			expect(result).toBeDefined()
		})

		test('trata campo case-insensitive (Password vs password)', () => {
			const result = sanitizeData({ Password: 'senha123' })
			expect(result.Password).toBe('[REDACTED]')
		})

		test('não mascara valores não-string em campos sensíveis', () => {
			const result = sanitizeData({ token: 12345 as unknown as string })
			expect(result.token).toBe(12345)
		})
	})

	describe('logger methods', () => {
		const originalEnv = process.env.NODE_ENV

		beforeEach(() => {
			jest.spyOn(console, 'log').mockImplementation()
			jest.spyOn(console, 'warn').mockImplementation()
			jest.spyOn(console, 'error').mockImplementation()
		})

		afterEach(() => {
			jest.restoreAllMocks()
			Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true })
		})

		test('logger.info chama console.log', () => {
			logger.info('Teste info')
			expect(console.log).toHaveBeenCalled()
		})

		test('logger.warn chama console.warn', () => {
			logger.warn('Teste warn')
			expect(console.warn).toHaveBeenCalled()
		})

		test('logger.error chama console.error', () => {
			logger.error('Teste error')
			expect(console.error).toHaveBeenCalled()
		})

		test('logger.debug chama console.log em desenvolvimento', () => {
			Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
			logger.debug('Teste debug')
			expect(console.log).toHaveBeenCalled()
		})

		test('logger.debug nao emite em produção', () => {
			Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
			logger.debug('Teste debug')
			expect(console.log).not.toHaveBeenCalled()
		})

		test('logger.info sanitiza dados sensíveis', () => {
			logger.info('Login', { email: 'user@test.com', password: '123' })
			const call = (console.log as jest.Mock).mock.calls[0][0] as string
			expect(call).not.toContain('123')
			expect(call).not.toContain('user@test.com')
		})

		test('logger.error em produção emite JSON', () => {
			Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
			logger.error('Erro grave', { userId: 'usr_1' })
			const call = (console.error as jest.Mock).mock.calls[0][0] as string
			const parsed = JSON.parse(call) as Record<string, unknown>
			expect(parsed.level).toBe('error')
			expect(parsed.message).toBe('Erro grave')
			expect(parsed.timestamp).toBeDefined()
		})
	})
})
