/**
 * Utilitario - FormatPhone
 *
 * Visao geral:
 * - Funcoes utilitarias para FormatPhone.
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
 * import * as modulo from "@/utils/formatPhone";
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
export const formatPhone = (value: string): string => {
	// Validação da entrada
	if (!value || typeof value !== 'string') {
		return ''
	}
	// Remove todos os caracteres que não são números usando regex
	const cleanedValue = value.replace(/\D/g, '')
	// Limita o tamanho máximo para evitar processamento desnecessário
	if (cleanedValue.length > 11) {
		return value.slice(0, 15)
	}
	// Aplica a máscara do telefone brasileiro
	// Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
	const formattedValue = cleanedValue
		// Adiciona parênteses no DDD: (XX)
		.replace(/^(\d{2})(\d)/g, '($1) $2')
		// Adiciona hífen: XXXX-XXXX ou XXXXX-XXXX
		.replace(/(\d{4,5})(\d{4})$/, '$1-$2')
	return formattedValue
}
/**
 *  Remove a formatação do telefone, retornando apenas os números
 *
 * @param phone - Número de telefone formatado ou não
 * @returns Apenas os dígitos numéricos do telefone
 *
 * @example
 * ```typescript
 * unformatPhone("(11) 99999-9999") // "11999999999"
 * unformatPhone("11 99999-9999")    // "1199999999"
 * ```
 */
export const unformatPhone = (phone: string): string => {
	if (!phone || typeof phone !== 'string') {
		return ''
	}
	return phone.replace(/\D/g, '')
}
/**
 *  Valida se um número de telefone tem formato válido
 *
 * @param phone - Número de telefone a ser validado
 * @returns true se o telefone for válido (10 ou 11 dígitos)
 *
 * @example
 * ```typescript
 * isValidPhone("11999999999")  // true
 * isValidPhone("1133334444")   // true
 * isValidPhone("123")          // false
 * ```
 */
export const isValidPhone = (phone: string): boolean => {
	if (!phone || typeof phone !== 'string') {
		return false
	}
	const cleaned = unformatPhone(phone)
	// Telefone válido: 10 dígitos (fixo) ou 11 dígitos (celular)
	return cleaned.length === 10 || cleaned.length === 11
}
/**
 *  Identifica se um telefone é celular ou fixo
 *
 * @param phone - Número de telefone
 * @returns Tipo do telefone ou null se inválido
 *
 * @example
 * ```typescript
 * getPhoneType("11999999999")  // "mobile"
 * getPhoneType("1133334444")   // "landline"
 * getPhoneType("123")          // null
 * ```
 */
export const getPhoneType = (phone: string): 'mobile' | 'landline' | null => {
	if (!isValidPhone(phone)) {
		return null
	}
	const cleaned = unformatPhone(phone)
	// Telefone celular tem 11 dígitos no Brasil
	return cleaned.length === 11 ? 'mobile' : 'landline'
}
