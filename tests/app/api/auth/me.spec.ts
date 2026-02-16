/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Me.spec
 *
 * Visao geral:
 * - Casos de teste para Me.spec.
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
 * import * as modulo from "@/tests/app/api/auth/me.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { GET } from '@/app/api/auth/me/route'
import { NextRequest } from 'next/server'
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
describe('GET /api/auth/me', () => {
	test('retorna 401 quando nao autenticado', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValue(null)
		const request = new NextRequest('http://localhost/api/auth/me')
		const response = await GET(request)
		expect(response.status).toBe(401)
	})
	test('retorna usuario quando autenticado', async () => {
		const { getUserFromRequest } = await import('@/lib/auth')
		;(getUserFromRequest as jest.Mock).mockResolvedValue({
			id: 'usr_1',
			email: 'henrique@teste.com',
		})
		const request = new NextRequest('http://localhost/api/auth/me')
		const response = await GET(request)
		expect(response.status).toBe(200)
	})
})
