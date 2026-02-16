/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes das server actions de funcionarios (criar, atualizar, deletar).
 * Valida fluxos de sucesso, duplicidade de email, propriedade e $transaction.
 *
 * @example
 * npx jest tests/app/actions/employees.spec.ts
 */
import prisma from '@/lib/prisma'
import { resetPrismaMock } from '@/tests/__mocks__/prisma'
import { createEmployee } from '@/app/(panel)/dashboard/services/employee/_actions/create-employee'
import { updateEmployee } from '@/app/(panel)/dashboard/services/employee/_actions/update-employee'
import { deleteEmployee } from '@/app/(panel)/dashboard/services/employee/_actions/delete-employee'

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

describe('Server Actions - Employees', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		resetPrismaMock()
	})

	test('createEmployee cria funcionario', async () => {
		;(prisma.employee.create as jest.Mock).mockResolvedValue({ id: 'emp_1' })
		const result = await createEmployee({
			name: 'Funcionario',
			email: 'func@teste.com',
			phone: '(11) 99999-9999',
			function: 'Barbeiro',
			serviceIds: [],
		})
		expect(result.success).toBe(true)
	})

	test('updateEmployee atualiza funcionario', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			UserId: 'usr_1',
			email: 'func@teste.com',
		})
		// $transaction executa callback com prisma mock, que ja tem os mocks configurados
		;(prisma.employeeService.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
		;(prisma.employee.update as jest.Mock).mockResolvedValue({ id: 'emp_1' })
		const result = await updateEmployee({
			id: 'emp_1',
			name: 'Funcionario',
			email: 'func@teste.com',
			phone: '(11) 99999-9999',
			function: 'Barbeiro',
			serviceIds: [],
		})
		expect(result.success).toBe(true)
	})

	test('deleteEmployee remove funcionario', async () => {
		;(prisma.employee.findUnique as jest.Mock).mockResolvedValue({
			id: 'emp_1',
			UserId: 'usr_1',
		})
		;(prisma.employee.delete as jest.Mock).mockResolvedValue({ id: 'emp_1' })
		const result = await deleteEmployee('emp_1')
		expect(result.success).toBe(true)
	})

	test('createEmployee retorna erro para constraint unica (P2002)', async () => {
		const prismaError = new Error('Unique constraint')
		Object.assign(prismaError, { code: 'P2002' })
		;(prisma.employee.create as jest.Mock).mockRejectedValue(prismaError)
		const result = await createEmployee({
			name: 'Funcionario',
			email: 'func@teste.com',
			phone: '(11) 99999-9999',
			function: 'Barbeiro',
			serviceIds: [],
		})
		expect(result.success).toBe(false)
	})
})
