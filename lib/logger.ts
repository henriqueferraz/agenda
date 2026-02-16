/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Logger estruturado com filtragem automática de dados sensíveis.
 * Em produção: formato JSON para ingestão por Sentry, Datadog ou similar.
 * Em desenvolvimento: formato legível com cores e timestamp.
 *
 * Campos sensíveis filtrados automaticamente: password, token, secret,
 * email (parcial), cpf, cnpj, authorization, cookie.
 *
 * @example
 * import { logger } from '@/lib/logger'
 *
 * logger.info('Agendamento criado', { appointmentId: '123', userId: 'usr_1' })
 * logger.error('Falha ao criar agendamento', { error: 'Horário indisponível' })
 * logger.warn('Rate limit atingido', { ip: '192.168.1.1' })
 * logger.debug('Payload recebido', { serviceId: 'srv_1' })
 */

/** Níveis de log disponíveis */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Estrutura de uma entrada de log */
interface LogEntry {
	/** Nível do log */
	level: LogLevel
	/** Mensagem descritiva */
	message: string
	/** Timestamp ISO 8601 */
	timestamp: string
	/** Dados adicionais (já sanitizados) */
	data?: Record<string, unknown>
}

/** Campos que devem ser completamente mascarados */
const FULLY_MASKED_FIELDS = new Set([
	'password',
	'senha',
	'secret',
	'token',
	'authorization',
	'cookie',
	'refreshtoken',
	'accesstoken',
	'apikey',
	'api_key',
])

/** Campos que devem ser parcialmente mascarados */
const PARTIALLY_MASKED_FIELDS = new Set([
	'email',
	'cpf',
	'cnpj',
	'phone',
	'telefone',
	'celular',
])

/** Cores ANSI para cada nível de log (apenas em desenvolvimento) */
const LEVEL_COLORS: Record<LogLevel, string> = {
	debug: '\x1b[36m', // Ciano
	info: '\x1b[32m', // Verde
	warn: '\x1b[33m', // Amarelo
	error: '\x1b[31m', // Vermelho
}

/** Reset da cor ANSI */
const RESET_COLOR = '\x1b[0m'

/** Cor cinza para timestamp */
const GRAY_COLOR = '\x1b[90m'

/**
 * Mascara parcialmente um valor de email, preservando início e domínio.
 *
 * @param value - Endereço de email
 * @returns Email com parte local parcialmente mascarada
 *
 * @example
 * maskEmail('usuario@example.com') // 'us***@example.com'
 */
const maskEmail = (value: string): string => {
	const atIndex = value.indexOf('@')
	if (atIndex <= 0) return '***'
	const local = value.substring(0, atIndex)
	const domain = value.substring(atIndex)
	const visible = Math.min(2, local.length)
	return local.substring(0, visible) + '***' + domain
}

/**
 * Mascara parcialmente um documento (CPF/CNPJ), preservando os 3 primeiros dígitos.
 *
 * @param value - Número do documento
 * @returns Documento com dígitos parcialmente mascarados
 *
 * @example
 * maskDocument('12345678901') // '123********'
 */
const maskDocument = (value: string): string => {
	const digits = value.replace(/\D/g, '')
	if (digits.length < 3) return '***'
	return digits.substring(0, 3) + '*'.repeat(digits.length - 3)
}

/**
 * Mascara parcialmente um telefone, preservando DDD e últimos 2 dígitos.
 *
 * @param value - Número de telefone
 * @returns Telefone com dígitos parcialmente mascarados
 *
 * @example
 * maskPhone('11999887766') // '11*****7766'
 */
const maskPhone = (value: string): string => {
	const digits = value.replace(/\D/g, '')
	if (digits.length < 4) return '***'
	return digits.substring(0, 2) + '*'.repeat(digits.length - 4) + digits.slice(-2)
}

/**
 * Sanitiza um valor individual baseado no nome do campo.
 *
 * @param key - Nome do campo (normalizado para lowercase)
 * @param value - Valor original
 * @returns Valor mascarado se sensível, original caso contrário
 */
const sanitizeValue = (key: string, value: unknown): unknown => {
	if (typeof value !== 'string') return value

	const normalizedKey = key.toLowerCase()

	if (FULLY_MASKED_FIELDS.has(normalizedKey)) {
		return '[REDACTED]'
	}

	if (PARTIALLY_MASKED_FIELDS.has(normalizedKey)) {
		if (normalizedKey === 'email') return maskEmail(value)
		if (normalizedKey === 'cpf' || normalizedKey === 'cnpj') return maskDocument(value)
		if (normalizedKey === 'phone' || normalizedKey === 'telefone' || normalizedKey === 'celular') {
			return maskPhone(value)
		}
	}

	return value
}

/**
 * Sanitiza recursivamente um objeto, mascarando campos sensíveis.
 * Limita profundidade a 5 níveis para evitar loops infinitos.
 *
 * @param obj - Objeto a ser sanitizado
 * @param depth - Profundidade atual da recursão (máx 5)
 * @returns Novo objeto com campos sensíveis mascarados
 *
 * @example
 * sanitizeData({ email: 'teste@example.com', password: '123' })
 * // { email: 'te***@example.com', password: '[REDACTED]' }
 */
export const sanitizeData = (obj: Record<string, unknown>, depth = 0): Record<string, unknown> => {
	if (depth > 5) return { '[MAX_DEPTH]': true }

	const result: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(obj)) {
		if (value === null || value === undefined) {
			result[key] = value
		} else if (Array.isArray(value)) {
			result[key] = value.map((item) =>
				typeof item === 'object' && item !== null
					? sanitizeData(item as Record<string, unknown>, depth + 1)
					: sanitizeValue(key, item),
			)
		} else if (typeof value === 'object') {
			result[key] = sanitizeData(value as Record<string, unknown>, depth + 1)
		} else {
			result[key] = sanitizeValue(key, value)
		}
	}

	return result
}

/**
 * Formata e emite uma entrada de log.
 * Em produção: JSON compacto para ingestão por serviços de observabilidade.
 * Em desenvolvimento: formato legível com cores ANSI e timestamp.
 *
 * @param entry - Entrada de log estruturada
 */
const emit = (entry: LogEntry): void => {
	const isProduction = process.env.NODE_ENV === 'production'

	if (isProduction) {
		const output = JSON.stringify(entry)
		if (entry.level === 'error') {
			console.error(output)
		} else if (entry.level === 'warn') {
			console.warn(output)
		} else {
			console.log(output)
		}
	} else {
		const color = LEVEL_COLORS[entry.level]
		const levelTag = `${color}[${entry.level.toUpperCase()}]${RESET_COLOR}`
		const time = `${GRAY_COLOR}${entry.timestamp}${RESET_COLOR}`
		const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : ''

		if (entry.level === 'error') {
			console.error(`${time} ${levelTag} ${entry.message}${dataStr}`)
		} else if (entry.level === 'warn') {
			console.warn(`${time} ${levelTag} ${entry.message}${dataStr}`)
		} else {
			console.log(`${time} ${levelTag} ${entry.message}${dataStr}`)
		}
	}
}

/**
 * Cria uma entrada de log com sanitização automática de dados sensíveis.
 *
 * @param level - Nível do log (debug, info, warn, error)
 * @param message - Mensagem descritiva do evento
 * @param data - Dados adicionais (serão sanitizados automaticamente)
 */
const log = (level: LogLevel, message: string, data?: Record<string, unknown>): void => {
	// Em produção, ignora logs de debug
	if (level === 'debug' && process.env.NODE_ENV === 'production') return

	const entry: LogEntry = {
		level,
		message,
		timestamp: new Date().toISOString(),
	}

	if (data) {
		entry.data = sanitizeData(data)
	}

	emit(entry)
}

/**
 * Logger estruturado com filtragem automática de dados sensíveis.
 *
 * @example
 * logger.info('Usuário autenticado', { userId: 'usr_1' })
 * logger.error('Falha na operação', { error: 'Timeout', serviceId: 'srv_1' })
 * logger.warn('Tentativa bloqueada', { ip: '10.0.0.1', attempts: 5 })
 * logger.debug('Dados recebidos', { appointmentId: 'apt_1' })
 */
export const logger = {
	/**
	 * Log de debug (ignorado em produção).
	 * @param message - Mensagem descritiva
	 * @param data - Dados adicionais (sanitizados automaticamente)
	 */
	debug: (message: string, data?: Record<string, unknown>): void => log('debug', message, data),

	/**
	 * Log informativo.
	 * @param message - Mensagem descritiva
	 * @param data - Dados adicionais (sanitizados automaticamente)
	 */
	info: (message: string, data?: Record<string, unknown>): void => log('info', message, data),

	/**
	 * Log de aviso.
	 * @param message - Mensagem descritiva
	 * @param data - Dados adicionais (sanitizados automaticamente)
	 */
	warn: (message: string, data?: Record<string, unknown>): void => log('warn', message, data),

	/**
	 * Log de erro.
	 * @param message - Mensagem descritiva
	 * @param data - Dados adicionais (sanitizados automaticamente)
	 */
	error: (message: string, data?: Record<string, unknown>): void => log('error', message, data),
}
