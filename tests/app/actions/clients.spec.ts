/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Testes das server actions de clientes (criar, atualizar).
 * Valida fluxos de sucesso, dados invalidos, CPF invalido, propriedade, P2002 e falhas de banco.
 *
 * @example
 * npx jest tests/app/actions/clients.spec.ts
 */
import prisma from '@/lib/prisma'
import { createClient } from '@/app/(panel)/dashboard/clients/_actions/create-client'
import { updateClient } from '@/app/(panel)/dashboard/clients/_actions/update-client'

jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
jest.mock('next/navigation', () => ({
	redirect: jest.fn(() => {
		throw new Error('REDIRECT')
	}),
}))

const VALID_CPF = '12345678909'

describe('Server Actions - Clients', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('createClient', () => {
		test('cria cliente com sucesso', async () => {
			;(prisma.client.create as jest.Mock).mockResolvedValue({
				id: 'cli_1',
				name: 'João Silva',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
				notes: null,
				createdAt: new Date(),
			})
			const result = await createClient({
				name: 'João Silva',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(true)
			expect(result.message).toContain('João Silva')
		})

		test('retorna erro para CPF invalido', async () => {
			const result = await createClient({
				name: 'João Silva',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: '11111111111',
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('Dados inválidos')
		})

		test('retorna erro para nome muito curto', async () => {
			const result = await createClient({
				name: 'A',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('Dados inválidos')
		})

		test('retorna erro para email invalido', async () => {
			const result = await createClient({
				name: 'João Silva',
				email: 'invalido',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('Dados inválidos')
		})

		test('trata erro P2002 duplicidade de CPF', async () => {
			const p2002Error = new Error('Unique constraint') as Error & { code: string; meta: { target: string[] } }
			p2002Error.code = 'P2002'
			p2002Error.meta = { target: ['userId', 'cpf'] }
			;(prisma.client.create as jest.Mock).mockRejectedValue(p2002Error)

			const result = await createClient({
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('CPF')
		})

		test('trata erro P2002 duplicidade de email', async () => {
			const p2002Error = new Error('Unique constraint') as Error & { code: string; meta: { target: string[] } }
			p2002Error.code = 'P2002'
			p2002Error.meta = { target: ['userId', 'email'] }
			;(prisma.client.create as jest.Mock).mockRejectedValue(p2002Error)

			const result = await createClient({
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('email')
		})

		test('retorna erro quando prisma falha', async () => {
			;(prisma.client.create as jest.Mock).mockRejectedValue(new Error('db down'))
			const result = await createClient({
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('Erro interno')
		})
	})

	describe('updateClient', () => {
		test('atualiza cliente com sucesso', async () => {
			;(prisma.client.findUnique as jest.Mock).mockResolvedValue({
				id: 'cli_1',
				name: 'João',
				userId: 'usr_1',
			})
			;(prisma.client.update as jest.Mock).mockResolvedValue({
				id: 'cli_1',
				name: 'João Atualizado',
				email: 'novo@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
				notes: null,
				updatedAt: new Date(),
			})
			const result = await updateClient({
				id: 'cli_1',
				name: 'João Atualizado',
				email: 'novo@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(true)
			expect(result.message).toContain('João Atualizado')
		})

		test('retorna erro quando cliente nao pertence ao usuario', async () => {
			;(prisma.client.findUnique as jest.Mock).mockResolvedValue({
				id: 'cli_1',
				name: 'João',
				userId: 'usr_2',
			})
			const result = await updateClient({
				id: 'cli_1',
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('permissão')
		})

		test('retorna erro quando cliente nao existe', async () => {
			;(prisma.client.findUnique as jest.Mock).mockResolvedValue(null)
			const result = await updateClient({
				id: 'cli_999',
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: VALID_CPF,
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('não encontrado')
		})

		test('retorna erro para CPF invalido', async () => {
			const result = await updateClient({
				id: 'cli_1',
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: '00000000000',
			})
			expect(result.success).toBe(false)
			expect(result.error).toContain('Dados inválidos')
		})
	})
})
