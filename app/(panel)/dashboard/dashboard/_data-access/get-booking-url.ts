/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-03-23
 * @version 2026.03.23
 * @projectVersion 0.9.0
 */
/**
 * Data Access: retorna a URL publica curta de agendamento (`/a/{booking_public_code}`).
 * Gera e persiste `booking_public_code` sob demanda quando o usuario ja possui `token_called`.
 * Usa variaveis de ambiente do servidor para URL absoluta correta.
 *
 * @example
 * const url = await getBookingUrl({ userId: 'usr_123' });
 */
'use server'
import { ensureBookingPublicCodeForUser } from '@/lib/booking-public-code'

interface GetBookingUrlProps {
	/** ID único do usuário */
	userId: string
}

/**
 * Retorna URL base pública da aplicação para montagem de links absolutos.
 * Prioriza variáveis de ambiente públicas e usa VERCEL_URL como fallback.
 * Ignora URLs locais (localhost, 127.0.0.1, IPs privados) em produção.
 *
 * @returns URL base normalizada sem barra final ou string vazia quando indisponível
 *
 * @example
 * ```typescript
 * const baseUrl = getPublicBaseUrl()
 * // "https://agenda.exemplo.com"
 * ```
 */
const getPublicBaseUrl = (): string => {
	const isProduction = process.env.NODE_ENV === 'production'
	
	// Prioriza NEXT_PUBLIC_APP_URL, depois NEXT_PUBLIC_BASE_URL, depois VERCEL_URL
	let baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

	// Em produção, ignora URLs locais que não funcionariam em dispositivos móveis
	if (baseUrl) {
		const urlLower = baseUrl.toLowerCase()
		const isLocalUrl =
			urlLower.includes('localhost') ||
			urlLower.includes('127.0.0.1') ||
			urlLower.match(/^https?:\/\/192\.168\./) ||
			urlLower.match(/^https?:\/\/10\./) ||
			urlLower.match(/^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./)

		if (isLocalUrl) {
			// Se for produção e URL local, tenta usar VERCEL_URL como fallback
			if (isProduction && process.env.VERCEL_URL) {
				console.warn(
					'getPublicBaseUrl: URL local detectada em produção. Usando VERCEL_URL como fallback.',
				)
				baseUrl = `https://${process.env.VERCEL_URL}`
			} else if (isProduction) {
				console.error(
					'getPublicBaseUrl: URL local detectada em produção sem VERCEL_URL disponível.',
				)
				return ''
			}
			// Em desenvolvimento, permite URL local
		}
	}

	return baseUrl.replace(/\/+$/, '')
}

/**
 * Retorna a URL completa de agendamento publico (formato curto `/a/{code}`).
 *
 * @param props - Propriedades da consulta
 * @returns URL completa ou null se usuario nao tiver `token_called` ou base publica indisponivel
 *
 * @example
 * ```typescript
 * const url = await getBookingUrl({ userId: "usr_123" });
 * // "https://agenda.exemplo.com/a/k3m9p2x7q1w4r8t6y0z5"
 * ```
 */
export const getBookingUrl = async ({
	userId,
}: GetBookingUrlProps): Promise<string | null> => {
	try {
		const shortCode = await ensureBookingPublicCodeForUser(userId)
		if (!shortCode) {
			return null
		}

		const baseUrl = getPublicBaseUrl()
		if (!baseUrl) {
			console.warn(
				'getBookingUrl: Variáveis de ambiente NEXT_PUBLIC_APP_URL ou NEXT_PUBLIC_BASE_URL não configuradas.',
				{
					NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'não configurado',
					NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'não configurado',
					VERCEL_URL: process.env.VERCEL_URL || 'não configurado',
					NODE_ENV: process.env.NODE_ENV,
				},
			)
			return null
		}

		const fullUrl = `${baseUrl}/a/${shortCode}`

		// Log apenas em desenvolvimento para debug
		if (process.env.NODE_ENV !== 'production') {
			console.log('getBookingUrl gerada:', {
				baseUrl,
				shortCode,
				fullUrl,
			})
		}

		return fullUrl
	} catch (error) {
		console.error('Erro ao gerar URL de agendamento:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
