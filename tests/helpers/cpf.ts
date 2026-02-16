/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Utilitario - CPF
 *
 * Visao geral:
 * - Utilitarios de teste para CPF.
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
 * import { generateValidCPF } from "@/tests/helpers/cpf";
 *
 * const cpf = generateValidCPF();
 * ```
 */
const calculateVerifierDigit = (
	digits: number[],
	weightStart: number,
): number => {
	// Passo 1: calcular somatorio ponderado dos digitos.
	// Passo 2: aplicar regra de modulo para o digito verificador.
	const sum = digits.reduce(
		(acc, digit, index) => acc + digit * (weightStart - index),
		0,
	)
	const remainder = sum % 11
	return remainder < 2 ? 0 : 11 - remainder
}
/**
 * Gera um CPF valido formatado para uso em testes
 */
export const generateValidCPF = (): string => {
	// Passo 1: gerar nove digitos base.
	// Passo 2: calcular e adicionar digitos verificadores.
	// Passo 3: formatar e retornar o CPF valido.
	const baseDigits: number[] = []
	for (let i = 0; i < 9; i++) {
		baseDigits.push(Math.floor(Math.random() * 10))
	}
	const firstVerifier = calculateVerifierDigit(baseDigits, 10)
	baseDigits.push(firstVerifier)
	const secondVerifier = calculateVerifierDigit(baseDigits, 11)
	baseDigits.push(secondVerifier)
	const cpfString = baseDigits.join('')
	return cpfString.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
