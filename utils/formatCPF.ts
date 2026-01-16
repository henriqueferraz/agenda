/**
 * Utilitario - FormatCPF
 *
 * Visao geral:
 * - Funcoes utilitarias para FormatCPF.
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
 * import * as modulo from "@/utils/formatCPF";
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
	// Passo 1: calcular somatorio ponderado dos digitos.
	// Passo 2: aplicar regra de modulo para o digito verificador.
	const sum = digits.reduce((acc, digit, index) => {
		return acc + digit * (weightStart - index)
	}, 0)
	const remainder = sum % 11
	return remainder < 2 ? 0 : 11 - remainder
}
/**
 * Valida se um CPF é válido usando o algoritmo oficial
 * @param cpf - CPF com apenas números (11 dígitos)
 * @returns true se o CPF é válido
 */
const isValidCPF = (cpf: string): boolean => {
	// Passo 1: validar tamanho e padroes invalidos.
	// Passo 2: calcular digitos verificadores e comparar.
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
	// Passo 1: validar entrada e normalizar para numeros.
	// Passo 2: validar CPF usando algoritmo oficial.
	// Passo 3: formatar ou manter entrada conforme validade.
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
 */
export const unformatCPF = (cpf: string): string => {
	// Passo 1: remover caracteres nao numericos.
	// Passo 2: retornar somente digitos.
	return cpf.replace(/\D/g, '')
}
/**
 * Aplica máscara de CPF (XXX.XXX.XXX-XX) a uma string numérica
 * @param cpf - CPF apenas com números
 * @returns CPF formatado
 */
export const maskCPF = (cpf: string): string => {
	// Passo 1: limpar entrada para apenas digitos.
	// Passo 2: aplicar mascara padrao do CPF.
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
 */
export const isCPFValid = (cpf: string): boolean => {
	// Passo 1: validar entrada e limpar mascaras.
	// Passo 2: validar tamanho e algoritmo de verificacao.
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
 */
export const normalizeCPF = (cpf: string): string => {
	// Passo 1: usar formatacao com validacao.
	// Passo 2: devolver formatado se valido.
	const result = formatCPF(cpf)
	return result.isValid ? result.formatted : cpf
}
/**
 * Exemplos de uso:
 *
 * // Validação e formatação
 * const result = formatCPF('12345678909');
 * console.log(result.formatted); // '123.456.789-09'
 * console.log(result.isValid);   // true
 *
 * // Apenas formatação (sem validação)
 * const formatted = maskCPF('12345678909'); // '123.456.789-09'
 *
 * // Remover formatação
 * const clean = unformatCPF('123.456.789-09'); // '12345678909'
 *
 * // Usar em validação de formulários
 * if (cpfPatterns.flexible.test(inputValue)) {
 *     const { formatted, isValid } = formatCPF(inputValue);
 *     if (isValid) {
 *         // CPF válido
 *     }
 * }
 */
