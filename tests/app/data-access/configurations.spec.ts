/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Configurations.spec
 *
 * Visao geral:
 * - Casos de teste para Configurations.spec.
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
 * import * as modulo from "@/tests/app/data-access/configurations.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import prisma from '@/lib/prisma'
import { getInfoUser } from '@/app/(panel)/dashboard/configurations/model/_data-access/get-info-user'
import { getInfoActivity } from '@/app/(panel)/dashboard/configurations/activity/_data-access/get-info-activity'
import { getInfoAddress } from '@/app/(panel)/dashboard/configurations/address/_data-access/get-info-address'
import { getInfoTimes } from '@/app/(panel)/dashboard/configurations/time/_data-access/get-info-times'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
describe('Data Access - Configuracoes', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	test('getInfoUser retorna null quando falha', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
		const result = await getInfoUser({ userId: 'usr_1' })
		expect(result).toBeNull()
	})
	test('getInfoActivity retorna usuario', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			activity: 'Barbearia',
			subscription: null,
		})
		const result = await getInfoActivity({ userId: 'usr_1' })
		expect(result?.activity).toBe('Barbearia')
	})
	test('getInfoAddress retorna usuario com endereco', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			Address: { zip_code: '12345-678' },
		})
		const result = await getInfoAddress({ userId: 'usr_1' })
		expect(result?.Address?.zip_code).toBe('12345-678')
	})
	test('getInfoTimes retorna horarios', async () => {
		;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			mon_times: ['08:00'],
		})
		const result = await getInfoTimes({ userId: 'usr_1' })
		expect(result?.mon_times).toContain('08:00')
	})
})
