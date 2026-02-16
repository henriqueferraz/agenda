/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Utilitario - CNPJ
 *
 * Visao geral:
 * - Utilitarios de teste para CNPJ.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes e helpers locais.
 * 3. Exporta funcoes para uso em testes.
 *
 * Responsabilidades:
 * - Gerar dados validos para testes.
 * - Simplificar criacao de fixtures.
 * - Evitar duplicacao de logica em suites.
 *
 * ## Exemplo de uso
 * ```typescript
 * import { generateValidCNPJ } from '@/tests/helpers/cnpj'
 *
 * const cnpj = generateValidCNPJ()
 * ```
 */

const calculateVerifierDigit = (
	digits: number[],
	weightStart: number,
): number => {
	// Passo 1: calcular somatorio ponderado dos digitos.
	// Passo 2: aplicar regra de modulo para o digito verificador.
	const weights: number[] = []
	let weight = weightStart
	for (let i = 0; i < digits.length; i++) {
		weights.push(weight)
		weight = weight === 2 ? 9 : weight - 1
	}
	let sum = 0
	for (let i = 0; i < digits.length; i++) {
		sum += digits[i] * weights[i]
	}
	const remainder = sum % 11
	return remainder < 2 ? 0 : 11 - remainder
}

/**
 * Gera um CNPJ valido formatado para uso em testes
 */
export const generateValidCNPJ = (): string => {
	// Passo 1: gerar doze digitos base.
	// Passo 2: calcular e adicionar digitos verificadores.
	// Passo 3: formatar e retornar o CNPJ valido.
	const baseDigits: number[] = []
	for (let i = 0; i < 12; i++) {
		baseDigits.push(Math.floor(Math.random() * 10))
	}
	const firstVerifier = calculateVerifierDigit(baseDigits, 5)
	baseDigits.push(firstVerifier)
	const secondVerifier = calculateVerifierDigit(baseDigits, 6)
	baseDigits.push(secondVerifier)
	const cnpjString = baseDigits.join('')
	return cnpjString.replace(
		/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
		'$1.$2.$3/$4-$5',
	)
}
