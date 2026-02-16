/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Formatters.spec
 *
 * Visao geral:
 * - Casos de teste para Formatters.spec.
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
 * import * as modulo from "@/tests/utils/formatters.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { formatCPF, unformatCPF, maskCPF, isCPFValid } from '@/utils/formatCPF'
import {
	formatCNPJ,
	unformatCNPJ,
	maskCNPJ,
	isCNPJValid,
} from '@/utils/formatCNPJ'
import { generateValidCPF } from '@/tests/helpers/cpf'
import { generateValidCNPJ } from '@/tests/helpers/cnpj'
import {
	formatPhone,
	unformatPhone,
	isValidPhone,
	getPhoneType,
} from '@/utils/formatPhone'
import { formatCepDisplay } from '@/utils/cep'
import { formatCurrency, slugify, generateId, isValidEmail } from '@/lib/utils'
import { getNowInSaoPaulo, formatDateInSaoPaulo } from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
describe('Utilitarios de formatacao', () => {
	test('formatCPF valida e formata CPF conhecido', () => {
		const result = formatCPF('52998224725')
		expect(result.isValid).toBe(true)
		expect(result.formatted).toBe('529.982.247-25')
	})
	test('CPF invalido retorna isValid false', () => {
		const result = formatCPF('11111111111')
		expect(result.isValid).toBe(false)
	})
	test('helpers de CPF removem e aplicam mascara', () => {
		const cleaned = unformatCPF('529.982.247-25')
		expect(cleaned).toBe('52998224725')
		expect(maskCPF(cleaned)).toBe('529.982.247-25')
		const generated = generateValidCPF()
		expect(isCPFValid(generated)).toBe(true)
	})
	test('formatCNPJ valida e formata', () => {
		const generated = generateValidCNPJ()
		const result = formatCNPJ(generated)
		expect(result.isValid).toBe(true)
		expect(unformatCNPJ(result.formatted).length).toBe(14)
		expect(isCNPJValid(result.formatted)).toBe(true)
		expect(maskCNPJ(unformatCNPJ(result.formatted))).toBe(result.formatted)
	})
	test('formatPhone formata e valida telefone', () => {
		expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
		expect(unformatPhone('(11) 99999-9999')).toBe('11999999999')
		expect(isValidPhone('11999999999')).toBe(true)
		expect(getPhoneType('11999999999')).toBe('mobile')
	})
	test('formatCepDisplay aplica mascara brasileira', () => {
		expect(formatCepDisplay('01310100')).toBe('01310-100')
	})
	test('utils gerais formatam moeda e slug', () => {
		const normalized = formatCurrency(1500).replace(/\s+/g, ' ')
		expect(normalized).toBe('R$ 15,00')
		expect(slugify('Serviço Especial')).toBe('servico-especial')
		expect(isValidEmail('user@email.com')).toBe(true)
		expect(generateId('test')).toMatch(/^test_/)
	})
	test('date-timezone retorna strings formatadas', () => {
		const now = getNowInSaoPaulo()
		expect(now).toBeInstanceOf(Date)
		expect(formatDateInSaoPaulo(now)).toEqual(expect.any(String))
	})
})
