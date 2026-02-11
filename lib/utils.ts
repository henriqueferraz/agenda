/**
 * Utilitários gerais: cn (classes Tailwind), formatCurrency, formatDate, capitalize,
 * normalizeString, slugify, truncate, isValidEmail e generateId.
 *
 * @example
 * import { cn, formatCurrency } from '@/lib/utils'
 * cn('px-4', isActive && 'bg-blue-500')
 * formatCurrency(1500) // "R$ 15,00"
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
/**
 * Combina classes CSS com Tailwind CSS
 * Mescla classes conflitantes e remove duplicatas
 *
 * @param inputs - Classes CSS a serem combinadas
 * @returns String de classes otimizada
 *
 * @example
 * ```typescript
 * cn("bg-red-500", "text-white", condition && "p-4")
 * // Resultado: "bg-red-500 text-white p-4"
 * ```
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
/**
 * Formata um valor monetário em reais (BRL)
 *
 * @param value - Valor em centavos
 * @returns Valor formatado em reais com sempre 2 casas decimais
 *
 * @example
 * ```typescript
 * formatCurrency(1500) // "R$ 15,00"
 * formatCurrency(100050) // "R$ 1.000,50"
 * formatCurrency(100000) // "R$ 1.000,00"
 * ```
 */
export const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value / 100)
}
/**
 * Formata uma data para o padrão brasileiro
 *
 * @param date - Data a ser formatada
 * @param options - Opções de formatação
 * @returns Data formatada
 *
 * @example
 * ```typescript
 * formatDate(new Date()) // "15/01/2025"
 * formatDate(new Date(), { time: true }) // "15/01/2025 14:30"
 * ```
 */
export const formatDate = (
	date: Date | string,
	options: {
		time?: boolean
	} = {},
): string => {
	const d = typeof date === 'string' ? new Date(date) : date
	if (options.time) {
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(d)
	}
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(d)
}
/**
 * Capitaliza a primeira letra de cada palavra
 *
 * @param str - String a ser capitalizada
 * @returns String com primeiras letras maiúsculas
 *
 * @example
 * ```typescript
 * capitalize("joão da silva") // "João Da Silva"
 * ```
 */
export const capitalize = (str: string): string => {
	return str
		.toLowerCase()
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
/**
 * Remove acentos e caracteres especiais de uma string
 *
 * @param str - String a ser normalizada
 * @returns String sem acentos
 *
 * @example
 * ```typescript
 * normalizeString("João André") // "Joao Andre"
 * ```
 */
export const normalizeString = (str: string): string => {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
}
/**
 * Gera um slug URL-friendly a partir de uma string
 *
 * @param str - String a ser convertida em slug
 * @returns Slug formatado
 *
 * @example
 * ```typescript
 * slugify("Serviço de Corte de Cabelo") // "servico-de-corte-de-cabelo"
 * ```
 */
export const slugify = (str: string): string => {
	return normalizeString(str)
		.replace(/[^a-z0-9 -]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
}
/**
 * Trunca uma string se ela for maior que o limite especificado
 *
 * @param str - String a ser truncada
 * @param limit - Limite de caracteres
 * @returns String truncada com "..." se necessário
 *
 * @example
 * ```typescript
 * truncate("Esta é uma string muito longa", 20) // "Esta é uma string..."
 * ```
 */
export const truncate = (str: string, limit: number): string => {
	if (str.length <= limit) return str
	return str.slice(0, limit - 3) + '...'
}
/**
 * Verifica se uma string é um email válido
 *
 * @param email - Email a ser validado
 * @returns true se for um email válido
 *
 * @example
 * ```typescript
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid-email") // false
 * ```
 */
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}
/**
 * Gera um ID único simples (não criptograficamente seguro)
 *
 * @returns ID único baseado em timestamp
 *
 * @example
 * ```typescript
 * generateId() // "usr_1736934567890_123"
 * ```
 */
export const generateId = (prefix = 'id'): string => {
	const timestamp = Date.now()
	const random = Math.floor(Math.random() * 1000)
	return `${prefix}_${timestamp}_${random}`
}
