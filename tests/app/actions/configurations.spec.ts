/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes das server actions de configuracoes (atividade, modelo, endereco, horarios).
 * Valida fluxos de sucesso, erros de validacao e comportamentos de borda.
 */
import prisma from '@/lib/prisma'
import { updateActivity } from '@/app/(panel)/dashboard/configurations/activity/_actions/update-activity'
import { updateModel } from '@/app/(panel)/dashboard/configurations/model/_actions/update-model'
import { updateAddress } from '@/app/(panel)/dashboard/configurations/address/_actions/update-address'
import { updateTimes } from '@/app/(panel)/dashboard/configurations/time/_actions/update-times'
jest.mock('@/lib/auth', () => ({
	getUserFromToken: jest.fn(async () => ({ id: 'usr_1' })),
}))
jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))
describe('Server Actions - Configuracoes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('updateActivity atualiza atividade', async () => {
		; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
			; (prisma.user.findUnique as jest.Mock)
				.mockResolvedValueOnce({ be_called: 'Antigo', token_called: 'token' })
				.mockResolvedValueOnce(null)
			; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		const result = await updateActivity({
			activity: 'Barbearia',
			be_called: 'Minha Barbearia',
		})
		expect(result.data).toBeDefined()
	})
	test('updateActivity retorna erro para nome em uso', async () => {
		; (prisma.user.findUnique as jest.Mock)
			.mockResolvedValueOnce({ be_called: 'Antigo', token_called: 'token' })
			.mockResolvedValueOnce({ id: 'usr_2' })
		const result = await updateActivity({
			activity: 'Barbearia',
			be_called: 'Minha Barbearia',
		})
		expect(result.error).toBeDefined()
	})
	test('updateModel atualiza dados basicos', async () => {
		; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		const result = await updateModel({
			name: 'Henrique',
			phone: '(11) 99999-9999',
		})
		expect(result.data).toBeDefined()
	})
	test('updateAddress cria ou atualiza endereco', async () => {
		; (prisma.address.findUnique as jest.Mock).mockResolvedValue(null)
			; (prisma.address.create as jest.Mock).mockResolvedValue({ id: 'addr_1' })
			; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		const result = await updateAddress({
			zip_code: '12345-678',
			street: 'Rua X',
			number: '10',
			complement: '',
			neighborhood: 'Centro',
			city: 'Sao Paulo',
			state: 'SP',
			country: 'Brasil',
		})
		expect(result.data).toBeDefined()
	})
	test('updateAddress retorna erro para dados invalidos', async () => {
		const result = await updateAddress({
			zip_code: '123',
			street: 'R',
			number: '',
			complement: '',
			neighborhood: 'A',
			city: 'B',
			state: 'XX',
			country: 'B',
		})
		expect(result.error).toBeDefined()
	})
	test('updateTimes atualiza horarios', async () => {
		; (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'usr_1' })
		const result = await updateTimes({
			mon_times: ['08:00'],
			tue_times: [],
			wed_times: [],
			thu_times: [],
			fri_times: [],
			sat_times: [],
			sun_times: [],
		})
		expect(result.data).toBeDefined()
	})
	test('updateTimes retorna erro para horario invalido', async () => {
		const result = await updateTimes({
			mon_times: ['25:99'],
			tue_times: [],
			wed_times: [],
			thu_times: [],
			fri_times: [],
			sat_times: [],
			sun_times: [],
		})
		expect(result.error).toBeDefined()
	})
	test('updateTimes ordena horarios e remove duplicados', async () => {
		const updateSpy = prisma.user.update as jest.Mock
		updateSpy.mockResolvedValue({ id: 'usr_1' })
		await updateTimes({
			mon_times: ['10:00', '08:00', '10:00'],
			tue_times: [],
			wed_times: [],
			thu_times: [],
			fri_times: [],
			sat_times: [],
			sun_times: [],
		})
		const calledWith = updateSpy.mock.calls[0][0].data.mon_times
		expect(calledWith).toEqual(['08:00', '10:00'])
	})
})
