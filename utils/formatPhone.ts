/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Utilitários para formatação, validação e tipo de telefone brasileiro.
 * Suporta fixo (10 dígitos) e celular (11 dígitos) com máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 *
 * @example
 * import { formatPhone, isValidPhone } from '@/utils/formatPhone'
 * formatPhone('11999999999') // '(11) 99999-9999'
 */
/**
 * Formata um numero de telefone brasileiro aplicando mascara automatica.
 * Suporta telefones fixos (10 digitos) e celulares (11 digitos).
 * @param value - Numero de telefone (com ou sem formatacao)
 * @returns Telefone formatado no padrao (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * @example
 * formatPhone('11999999999')  // '(11) 99999-9999'
 * formatPhone('1133334444')   // '(11) 3333-4444'
 * formatPhone('')             // ''
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
