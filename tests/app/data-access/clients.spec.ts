/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Testes de data-access: getClients (paginado com busca), getClientById (com historico),
 * searchClientByCpf (autocomplete). Valida retorno vazio, paginacao, busca, propriedade e fallback.
 *
 * @example
 * npx jest tests/app/data-access/clients.spec.ts
 */
import prisma from '@/lib/prisma'
import { getClients } from '@/app/(panel)/dashboard/clients/_data-access/get-clients'
import { getClientById } from '@/app/(panel)/dashboard/clients/_data-access/get-client-by-id'
import { searchClientByCpf } from '@/app/(panel)/dashboard/clients/_data-access/search-client-by-cpf'

describe('Data Access - Clients', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getClients', () => {
		test('retorna vazio quando userId nao fornecido', async () => {
			const result = await getClients({ userId: '' })
			expect(result).toEqual({ clients: [], total: 0 })
			expect(prisma.client.findMany).not.toHaveBeenCalled()
		})

		test('retorna clientes com contagem de agendamentos', async () => {
			const clients = [
				{ id: 'cli_1', name: 'João', email: 'joao@mail.com', phone: '47999998888', cpf: '12345678909', notes: null, createdAt: new Date(), updatedAt: new Date(), _count: { appointments: 5 } },
			]
			;(prisma.client.findMany as jest.Mock).mockResolvedValue(clients)
			;(prisma.client.count as jest.Mock).mockResolvedValue(1)

			const result = await getClients({ userId: 'usr_1' })
			expect(result.clients).toEqual(clients)
			expect(result.total).toBe(1)
		})

		test('aplica paginacao corretamente', async () => {
			;(prisma.client.findMany as jest.Mock).mockResolvedValue([])
			;(prisma.client.count as jest.Mock).mockResolvedValue(0)

			await getClients({ userId: 'usr_1', page: 3, perPage: 10 })
			expect(prisma.client.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ skip: 20, take: 10 }),
			)
		})

		test('aplica busca por nome/email/phone/cpf', async () => {
			;(prisma.client.findMany as jest.Mock).mockResolvedValue([])
			;(prisma.client.count as jest.Mock).mockResolvedValue(0)

			await getClients({ userId: 'usr_1', search: 'João' })
			expect(prisma.client.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						userId: 'usr_1',
						OR: expect.arrayContaining([
							expect.objectContaining({ name: { contains: 'João', mode: 'insensitive' } }),
						]),
					}),
				}),
			)
		})

		test('retorna vazio quando prisma falha', async () => {
			;(prisma.client.findMany as jest.Mock).mockRejectedValue(new Error('db error'))
			const result = await getClients({ userId: 'usr_1' })
			expect(result).toEqual({ clients: [], total: 0 })
		})
	})

	describe('getClientById', () => {
		test('retorna null quando clientId nao fornecido', async () => {
			const result = await getClientById({ clientId: '', userId: 'usr_1' })
			expect(result).toBeNull()
		})

		test('retorna null quando userId nao fornecido', async () => {
			const result = await getClientById({ clientId: 'cli_1', userId: '' })
			expect(result).toBeNull()
		})

		test('retorna cliente com historico de agendamentos', async () => {
			const client = {
				id: 'cli_1',
				name: 'João',
				email: 'joao@mail.com',
				phone: '47999998888',
				cpf: '12345678909',
				notes: null,
				userId: 'usr_1',
				createdAt: new Date(),
				updatedAt: new Date(),
				appointments: [
					{ id: 'apt_1', service: { name: 'Corte', price: 3000, duration: 30 }, employee: { name: 'Maria' } },
				],
				_count: { appointments: 1 },
			}
			;(prisma.client.findUnique as jest.Mock).mockResolvedValue(client)

			const result = await getClientById({ clientId: 'cli_1', userId: 'usr_1' })
			expect(result).toEqual(client)
		})

		test('retorna null quando cliente pertence a outro usuario', async () => {
			;(prisma.client.findUnique as jest.Mock).mockResolvedValue({ id: 'cli_1', userId: 'usr_2' })
			const result = await getClientById({ clientId: 'cli_1', userId: 'usr_1' })
			expect(result).toBeNull()
		})

		test('retorna null quando prisma falha', async () => {
			;(prisma.client.findUnique as jest.Mock).mockRejectedValue(new Error('db error'))
			const result = await getClientById({ clientId: 'cli_1', userId: 'usr_1' })
			expect(result).toBeNull()
		})
	})

	describe('searchClientByCpf', () => {
		test('retorna null quando cpf nao fornecido', async () => {
			const result = await searchClientByCpf({ cpf: '', userId: 'usr_1' })
			expect(result).toBeNull()
			expect(prisma.client.findFirst).not.toHaveBeenCalled()
		})

		test('retorna null quando cpf tem menos de 11 digitos', async () => {
			const result = await searchClientByCpf({ cpf: '1234', userId: 'usr_1' })
			expect(result).toBeNull()
		})

		test('retorna cliente quando encontrado', async () => {
			const client = { id: 'cli_1', name: 'João', email: 'j@m.com', phone: '47999', cpf: '12345678909' }
			;(prisma.client.findFirst as jest.Mock).mockResolvedValue(client)

			const result = await searchClientByCpf({ cpf: '12345678909', userId: 'usr_1' })
			expect(result).toEqual(client)
			expect(prisma.client.findFirst).toHaveBeenCalledWith({
				where: { userId: 'usr_1', cpf: '12345678909' },
				select: { id: true, name: true, email: true, phone: true, cpf: true },
			})
		})

		test('retorna null quando nao encontrado', async () => {
			;(prisma.client.findFirst as jest.Mock).mockResolvedValue(null)
			const result = await searchClientByCpf({ cpf: '12345678909', userId: 'usr_1' })
			expect(result).toBeNull()
		})

		test('retorna null quando prisma falha', async () => {
			;(prisma.client.findFirst as jest.Mock).mockRejectedValue(new Error('db error'))
			const result = await searchClientByCpf({ cpf: '12345678909', userId: 'usr_1' })
			expect(result).toBeNull()
		})
	})
})
