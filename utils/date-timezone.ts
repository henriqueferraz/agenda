/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Utilitários de data e hora no timezone America/Sao_Paulo.
 * Fornece extração de componentes, criação de datas, início/fim do dia, comparação e formatação em pt-BR.
 *
 * @example
 * import { getDateComponentsInSaoPaulo, formatDateInSaoPaulo } from '@/utils/date-timezone'
 * const comp = getDateComponentsInSaoPaulo(new Date())
 * formatDateInSaoPaulo(new Date()) // "10/02/2025"
 */
const TIMEZONE = 'America/Sao_Paulo'
/**
 * Obtém os componentes de uma data no timezone America/Sao_Paulo
 *
 * Extrai ano, mês, dia, horas, minutos e segundos de uma data considerando
 * o timezone America/Sao_Paulo.
 *
 * @param date - Data a ser analisada
 * @returns Objeto com componentes da data no timezone America/Sao_Paulo
 *
 * @example
 * ```typescript
 * const date = new Date("2024-01-15T14:30:00Z");
 * const components = getDateComponentsInSaoPaulo(date);
 * // { year: 2024, month: 0, day: 15, hours: 11, minutes: 30, seconds: 0 }
 * ```
 */
export const getDateComponentsInSaoPaulo = (
	date: Date,
): {
	year: number
	month: number // 0-11
	day: number
	hours: number
	minutes: number
	seconds: number
} => {
	const formatter = new Intl.DateTimeFormat('pt-BR', {
		timeZone: TIMEZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})
	const parts = formatter.formatToParts(date)
	return {
		year: parseInt(parts.find((p) => p.type === 'year')?.value || '0'),
		month: parseInt(parts.find((p) => p.type === 'month')?.value || '1') - 1,
		day: parseInt(parts.find((p) => p.type === 'day')?.value || '1'),
		hours: parseInt(parts.find((p) => p.type === 'hour')?.value || '0'),
		minutes: parseInt(parts.find((p) => p.type === 'minute')?.value || '0'),
		seconds: parseInt(parts.find((p) => p.type === 'second')?.value || '0'),
	}
}
/**
 * Cria uma data no timezone America/Sao_Paulo a partir de componentes
 *
 * Cria um objeto Date que representa a data/hora especificada no timezone
 * America/Sao_Paulo, ajustando automaticamente para compensar diferenças
 * de timezone.
 *
 * @param year - Ano (ex: 2024)
 * @param month - Mês (0-11, onde 0 = janeiro)
 * @param day - Dia (1-31)
 * @param hours - Horas (0-23), padrão 0
 * @param minutes - Minutos (0-59), padrão 0
 * @param seconds - Segundos (0-59), padrão 0
 * @param milliseconds - Milissegundos (0-999), padrão 0
 * @returns Date criada no timezone America/Sao_Paulo
 *
 * @example
 * ```typescript
 * const date = createDateInSaoPaulo(2024, 0, 15, 14, 30, 0);
 * // Cria data: 15 de janeiro de 2024, 14:30:00 no timezone America/Sao_Paulo
 * ```
 */
export const createDateInSaoPaulo = (
	year: number,
	month: number,
	day: number,
	hours: number = 0,
	minutes: number = 0,
	seconds: number = 0,
	milliseconds: number = 0,
): Date => {
	// Cria uma data local primeiro
	const localDate = new Date(
		year,
		month,
		day,
		hours,
		minutes,
		seconds,
		milliseconds,
	)
	// Obtém os componentes dessa data no timezone America/Sao_Paulo
	const components = getDateComponentsInSaoPaulo(localDate)
	// Calcula a diferença entre o que queremos e o que temos
	const targetComponents = { year, month, day, hours, minutes, seconds }
	const diff = {
		year: targetComponents.year - components.year,
		month: targetComponents.month - components.month,
		day: targetComponents.day - components.day,
		hours: targetComponents.hours - components.hours,
		minutes: targetComponents.minutes - components.minutes,
		seconds: targetComponents.seconds - components.seconds,
	}
	// Ajusta a data local para compensar a diferença
	const adjustedDate = new Date(
		localDate.getFullYear() + diff.year,
		localDate.getMonth() + diff.month,
		localDate.getDate() + diff.day,
		localDate.getHours() + diff.hours,
		localDate.getMinutes() + diff.minutes,
		localDate.getSeconds() + diff.seconds,
		milliseconds,
	)
	return adjustedDate
}
/**
 * Obtém a data/hora atual no timezone America/Sao_Paulo
 *
 * Retorna a data/hora atual do sistema. O JavaScript já trabalha com o
 * timezone local, então esta função retorna o equivalente ao timezone
 * America/Sao_Paulo quando executado em servidor/configurado corretamente.
 *
 * @returns Date com data/hora atual
 *
 * @example
 * ```typescript
 * const now = getNowInSaoPaulo();
 * console.log(now); // Data/hora atual
 * ```
 */
export const getNowInSaoPaulo = (): Date => {
	return new Date()
}
/**
 * Normaliza uma data para o início do dia (00:00:00) no timezone America/Sao_Paulo
 *
 * Retorna uma nova data representando o início do dia (00:00:00.000) da data
 * fornecida, considerando o timezone America/Sao_Paulo.
 *
 * @param date - Data a ser normalizada
 * @returns Date com início do dia (00:00:00.000)
 *
 * @example
 * ```typescript
 * const date = new Date("2024-01-15T14:30:00");
 * const start = startOfDayInSaoPaulo(date);
 * // Retorna: 2024-01-15T00:00:00 (no timezone America/Sao_Paulo)
 * ```
 */
export const startOfDayInSaoPaulo = (date: Date): Date => {
	const components = getDateComponentsInSaoPaulo(date)
	return createDateInSaoPaulo(
		components.year,
		components.month,
		components.day,
		0,
		0,
		0,
		0,
	)
}
/**
 * Normaliza uma data para o final do dia (23:59:59.999) no timezone America/Sao_Paulo
 *
 * Retorna uma nova data representando o final do dia (23:59:59.999) da data
 * fornecida, considerando o timezone America/Sao_Paulo.
 *
 * @param date - Data a ser normalizada
 * @returns Date com final do dia (23:59:59.999)
 *
 * @example
 * ```typescript
 * const date = new Date("2024-01-15T14:30:00");
 * const end = endOfDayInSaoPaulo(date);
 * // Retorna: 2024-01-15T23:59:59.999 (no timezone America/Sao_Paulo)
 * ```
 */
export const endOfDayInSaoPaulo = (date: Date): Date => {
	const components = getDateComponentsInSaoPaulo(date)
	return createDateInSaoPaulo(
		components.year,
		components.month,
		components.day,
		23,
		59,
		59,
		999,
	)
}
/**
 * Compara duas datas normalizadas (apenas dia, mês, ano) no timezone America/Sao_Paulo
 *
 * Compara apenas a parte de data (ignorando hora) de duas datas no timezone
 * America/Sao_Paulo. Útil para verificar se duas datas são do mesmo dia.
 *
 * @param date1 - Primeira data a ser comparada
 * @param date2 - Segunda data a ser comparada
 * @returns Número negativo se date1 < date2, 0 se iguais, positivo se date1 > date2
 *
 * @example
 * ```typescript
 * const date1 = new Date("2024-01-15T10:00:00");
 * const date2 = new Date("2024-01-15T20:00:00");
 * compareDatesInSaoPaulo(date1, date2); // 0 (mesmo dia)
 * ```
 */
export const compareDatesInSaoPaulo = (date1: Date, date2: Date): number => {
	const d1 = startOfDayInSaoPaulo(date1)
	const d2 = startOfDayInSaoPaulo(date2)
	return d1.getTime() - d2.getTime()
}
/**
 * Verifica se uma data é hoje no timezone America/Sao_Paulo
 *
 * Compara a data fornecida com a data atual, considerando apenas dia, mês e ano
 * no timezone America/Sao_Paulo.
 *
 * @param date - Data a ser verificada
 * @returns true se a data for hoje, false caso contrário
 *
 * @example
 * ```typescript
 * const today = new Date();
 * isTodayInSaoPaulo(today); // true
 *
 * const tomorrow = new Date();
 * tomorrow.setDate(tomorrow.getDate() + 1);
 * isTodayInSaoPaulo(tomorrow); // false
 * ```
 */
export const isTodayInSaoPaulo = (date: Date): boolean => {
	const now = getNowInSaoPaulo()
	return compareDatesInSaoPaulo(date, now) === 0
}
/**
 * Verifica se uma data é passada no timezone America/Sao_Paulo
 *
 * Compara a data fornecida com a data/hora atual para determinar se já passou.
 *
 * @param date - Data a ser verificada
 * @returns true se a data for no passado, false caso contrário
 *
 * @example
 * ```typescript
 * const yesterday = new Date();
 * yesterday.setDate(yesterday.getDate() - 1);
 * isPastInSaoPaulo(yesterday); // true
 *
 * const tomorrow = new Date();
 * tomorrow.setDate(tomorrow.getDate() + 1);
 * isPastInSaoPaulo(tomorrow); // false
 * ```
 */
export const isPastInSaoPaulo = (date: Date): boolean => {
	return date.getTime() < getNowInSaoPaulo().getTime()
}
/**
 * Formata uma data para string no formato brasileiro no timezone America/Sao_Paulo
 *
 * Formata uma data para exibição em português brasileiro, considerando o
 * timezone America/Sao_Paulo.
 *
 * @param date - Data a ser formatada
 * @param options - Opções de formatação do Intl.DateTimeFormat (opcional)
 * @returns String formatada no formato brasileiro
 *
 * @example
 * ```typescript
 * const date = new Date("2024-01-15");
 * formatDateInSaoPaulo(date); // "15/01/2024"
 * formatDateInSaoPaulo(date, { weekday: 'long' }); // "segunda-feira, 15 de janeiro de 2024"
 * ```
 */
export const formatDateInSaoPaulo = (
	date: Date,
	options?: Intl.DateTimeFormatOptions,
): string => {
	return date.toLocaleDateString('pt-BR', {
		timeZone: TIMEZONE,
		...options,
	})
}
/**
 * Formata uma data e hora para string no formato brasileiro no timezone America/Sao_Paulo
 *
 * Formata uma data e hora para exibição em português brasileiro, considerando
 * o timezone America/Sao_Paulo.
 *
 * @param date - Data e hora a serem formatadas
 * @param options - Opções de formatação do Intl.DateTimeFormat (opcional)
 * @returns String formatada no formato brasileiro com data e hora
 *
 * @example
 * ```typescript
 * const date = new Date("2024-01-15T14:30:00");
 * formatDateTimeInSaoPaulo(date); // "15/01/2024 14:30:00"
 * ```
 */
export const formatDateTimeInSaoPaulo = (
	date: Date,
	options?: Intl.DateTimeFormatOptions,
): string => {
	return date.toLocaleString('pt-BR', {
		timeZone: TIMEZONE,
		...options,
	})
}
