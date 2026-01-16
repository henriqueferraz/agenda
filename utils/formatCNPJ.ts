/**
 * Utilitario - FormatCNPJ
 *
 * Visao geral:
 * - Funcoes utilitarias para FormatCNPJ.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Concentrar helpers simples e reutilizaveis.
 * - Simplificar transformacoes de dados.
 * - Manter consistencia de formato.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/utils/formatCNPJ";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
/**
 * Regex para remover caracteres não numéricos
 */
const NON_DIGIT_REGEX = /\D/g
/**
 * Regex para detectar CNPJs com todos os dígitos iguais
 */
const REPEATED_DIGITS_REGEX = /^(\d)\1{13}$/
/**
 * Regex para validar formato de CNPJ formatado
 */
const FORMATTED_CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
/**
 * Calcula um dígito verificador do CNPJ
 * @param digits - Array com os dígitos do CNPJ
 * @param weightStart - Peso inicial para o cálculo
 * @returns Dígito verificador calculado
 */
const calculateVerifierDigit = (
	digits: number[],
	weightStart: number,
): number => {
	const weights = []
	let weight = weightStart
	// Cria array de pesos (5,4,3,2,9,8,7,6,5,4,3,2 para primeiro dígito)
	// (6,5,4,3,2,9,8,7,6,5,4,3,2 para segundo dígito)
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
 * Valida se um CNPJ é válido usando o algoritmo oficial
 * @param cnpj - CNPJ com apenas números (14 dígitos)
 * @returns true se o CNPJ é válido
 */
const isValidCNPJ = (cnpj: string): boolean => {
	// Verifica se tem exatamente 14 dígitos
	if (cnpj.length !== 14) {
		return false
	}
	// Verifica se todos os dígitos são iguais (CNPJs inválidos como 11.111.111/1111-11)
	if (REPEATED_DIGITS_REGEX.test(cnpj)) {
		return false
	}
	// Converte string para array de números
	const digits = cnpj.split('').map(Number)
	// Calcula primeiro dígito verificador (posição 12, pesos 5-2,9-2)
	const firstVerifier = calculateVerifierDigit(digits.slice(0, 12), 5)
	if (firstVerifier !== digits[12]) {
		return false
	}
	// Calcula segundo dígito verificador (posição 13, pesos 6-2,9-2)
	const secondVerifier = calculateVerifierDigit(digits.slice(0, 13), 6)
	if (secondVerifier !== digits[13]) {
		return false
	}
	return true
}
/**
 * Formata e valida um CNPJ brasileiro
 * @param cnpj - CNPJ a ser formatado (com ou sem máscara)
 * @returns Objeto com CNPJ formatado e validação
 */
export const formatCNPJ = (
	cnpj: string,
): {
	formatted: string
	isValid: boolean
} => {
	// Valida entrada
	if (!cnpj || typeof cnpj !== 'string') {
		return {
			formatted: '',
			isValid: false,
		}
	}
	// Remove todos os caracteres não numéricos
	const cleanCNPJ = cnpj.replace(NON_DIGIT_REGEX, '')
	// Verifica se tem exatamente 14 dígitos após limpeza
	if (cleanCNPJ.length !== 14) {
		return {
			formatted: cnpj,
			isValid: false,
		}
	}
	// Valida o CNPJ usando o algoritmo oficial
	const isValid = isValidCNPJ(cleanCNPJ)
	// Formata o CNPJ com máscara se for válido ou se foi fornecido já limpo
	let formatted: string
	if (isValid || FORMATTED_CNPJ_REGEX.test(cnpj)) {
		formatted = cleanCNPJ.replace(
			/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
			'$1.$2.$3/$4-$5',
		)
	} else {
		formatted = cnpj // Mantém o formato original se inválido
	}
	return {
		formatted,
		isValid,
	}
}
/**
 * Remove a formatação do CNPJ, retornando apenas os números
 * @param cnpj - CNPJ formatado ou não
 * @returns CNPJ apenas com números
 */
export const unformatCNPJ = (cnpj: string): string => {
	return cnpj.replace(NON_DIGIT_REGEX, '')
}
/**
 * Aplica máscara de CNPJ (XX.XXX.XXX/XXXX-XX) a uma string numérica
 * @param cnpj - CNPJ apenas com números
 * @returns CNPJ formatado
 */
export const maskCNPJ = (cnpj: string): string => {
	const cleanCNPJ = unformatCNPJ(cnpj)
	return cleanCNPJ.replace(
		/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
		'$1.$2.$3/$4-$5',
	)
}
/**
 * Regex patterns para validação de CNPJ
 */
export const cnpjPatterns = {
	// Apenas números: exatamente 14 dígitos
	onlyNumbers: /^\d{14}$/,
	// Com máscara: XX.XXX.XXX/XXXX-XX
	withMask: FORMATTED_CNPJ_REGEX,
	// Permite ambos: com ou sem máscara
	flexible: /^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/,
	// Para detectar dígitos repetidos
	repeatedDigits: REPEATED_DIGITS_REGEX,
}
/**
 * Verifica se uma string é um CNPJ válido (apenas validação, sem formatação)
 * @param cnpj - CNPJ a ser validado
 * @returns true se for um CNPJ válido
 */
export const isCNPJValid = (cnpj: string): boolean => {
	if (!cnpj || typeof cnpj !== 'string') {
		return false
	}
	const cleanCNPJ = cnpj.replace(NON_DIGIT_REGEX, '')
	return cleanCNPJ.length === 14 && isValidCNPJ(cleanCNPJ)
}
/**
 * Normaliza um CNPJ para o formato padrão (XX.XXX.XXX/XXXX-XX) se válido
 * @param cnpj - CNPJ a ser normalizado
 * @returns CNPJ formatado se válido, string original caso contrário
 */
export const normalizeCNPJ = (cnpj: string): string => {
	const result = formatCNPJ(cnpj)
	return result.isValid ? result.formatted : cnpj
}
