/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Utilitários para formatação, validação e normalização de CPF brasileiro.
 * Inclui máscara XXX.XXX.XXX-XX, validação por dígitos verificadores e regex de padrões.
 *
 * @example
 * import { formatCPF, isCPFValid, unformatCPF } from '@/utils/formatCPF'
 * const result = formatCPF('12345678909')
 * console.log(result.formatted) // '123.456.789-09'
 * console.log(result.isValid)     // true
 */
/**
 * Regex para remover caracteres não numéricos
 */
const NON_DIGIT_REGEX = /\D/g
/**
 * Regex para detectar CPFs com todos os dígitos iguais
 */
const REPEATED_DIGITS_REGEX = /^(\d)\1{10}$/
/**
 * Regex para validar formato de CPF formatado
 */
const FORMATTED_CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
/**
 * Calcula um dígito verificador do CPF
 * @param digits - Array com os dígitos do CPF
 * @param weightStart - Peso inicial para o cálculo
 * @returns Dígito verificador calculado
 */
const calculateVerifierDigit = (
	digits: number[],
	weightStart: number,
): number => {
	const sum = digits.reduce((acc, digit, index) => acc + digit * (weightStart - index), 0)
	const remainder = sum % 11
	return remainder < 2 ? 0 : 11 - remainder
}
/**
 * Valida se um CPF é válido usando o algoritmo oficial
 * @param cpf - CPF com apenas números (11 dígitos)
 * @returns true se o CPF é válido
 */
const isValidCPF = (cpf: string): boolean => {
	// Verifica se tem exatamente 11 dígitos
	if (cpf.length !== 11) {
		return false
	}
	// Verifica se todos os dígitos são iguais (CPFs inválidos como 111.111.111-11)
	if (REPEATED_DIGITS_REGEX.test(cpf)) {
		return false
	}
	// Converte string para array de números
	const digits = cpf.split('').map(Number)
	// Calcula primeiro dígito verificador (posição 9, pesos 10-2)
	const firstVerifier = calculateVerifierDigit(digits.slice(0, 9), 10)
	if (firstVerifier !== digits[9]) {
		return false
	}
	// Calcula segundo dígito verificador (posição 10, pesos 11-2)
	const secondVerifier = calculateVerifierDigit(digits.slice(0, 10), 11)
	if (secondVerifier !== digits[10]) {
		return false
	}
	return true
}
/**
 * Formata e valida um CPF brasileiro
 * @param cpf - CPF a ser formatado (com ou sem máscara)
 * @returns Objeto com CPF formatado e validação
 */
export const formatCPF = (
	cpf: string,
): {
	formatted: string
	isValid: boolean
} => {
	// Valida entrada
	if (!cpf || typeof cpf !== 'string') {
		return {
			formatted: '',
			isValid: false,
		}
	}
	// Remove todos os caracteres não numéricos
	const cleanCPF = cpf.replace(NON_DIGIT_REGEX, '')
	// Verifica se tem exatamente 11 dígitos após limpeza
	if (cleanCPF.length !== 11) {
		return {
			formatted: cpf,
			isValid: false,
		}
	}
	// Valida o CPF usando o algoritmo oficial
	const isValid = isValidCPF(cleanCPF)
	// Formata o CPF com máscara se for válido ou se foi fornecido já limpo
	let formatted: string
	if (isValid || FORMATTED_CPF_REGEX.test(cpf)) {
		formatted = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
	} else {
		formatted = cpf // Mantém o formato original se inválido
	}
	return {
		formatted,
		isValid,
	}
}
/**
 * Remove a formatação do CPF, retornando apenas os números
 * @param cpf - CPF formatado ou não
 * @returns CPF apenas com números
 * @example
 * unformatCPF('123.456.789-09') // '12345678909'
 */
export const unformatCPF = (cpf: string): string => cpf.replace(/\D/g, '')
/**
 * Aplica máscara de CPF (XXX.XXX.XXX-XX) a uma string numérica
 * @param cpf - CPF apenas com números
 * @returns CPF formatado
 * @example
 * maskCPF('12345678909') // '123.456.789-09'
 */
export const maskCPF = (cpf: string): string => {
	const cleanCPF = unformatCPF(cpf)
	return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Regex patterns para validação de CPF
 */
export const cpfPatterns = {
	// Apenas números: exatamente 11 dígitos
	onlyNumbers: /^\d{11}$/,
	// Com máscara: XXX.XXX.XXX-XX
	withMask: FORMATTED_CPF_REGEX,
	// Permite ambos: com ou sem máscara
	flexible: /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/,
	// Para detectar dígitos repetidos
	repeatedDigits: REPEATED_DIGITS_REGEX,
}
/**
 * Verifica se uma string é um CPF válido (apenas validação, sem formatação)
 * @param cpf - CPF a ser validado
 * @returns true se for um CPF válido
 * @example
 * isCPFValid('12345678909') // true
 * isCPFValid('11111111111') // false
 */
export const isCPFValid = (cpf: string): boolean => {
	if (!cpf || typeof cpf !== 'string') {
		return false
	}
	const cleanCPF = cpf.replace(NON_DIGIT_REGEX, '')
	return cleanCPF.length === 11 && isValidCPF(cleanCPF)
}
/**
 * Normaliza um CPF para o formato padrão (XXX.XXX.XXX-XX) se válido
 * @param cpf - CPF a ser normalizado
 * @returns CPF formatado se válido, string original caso contrário
 * @example
 * normalizeCPF('12345678909') // '123.456.789-09'
 * normalizeCPF('invalido')    // 'invalido'
 */
export const normalizeCPF = (cpf: string): string => {
	const result = formatCPF(cpf)
	return result.isValid ? result.formatted : cpf
}
