/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Data Access: retorna a URL completa de agendamento público do usuário.
 * Usa variáveis de ambiente do servidor para garantir URL absoluta correta.
 *
 * @example
 * const url = await getBookingUrl({ userId: 'usr_123' });
 */
'use server'
import { getUserToken } from './get-user-token'

interface GetBookingUrlProps {
	/** ID único do usuário */
	userId: string
}

/**
 * Retorna URL base pública da aplicação para montagem de links absolutos.
 * Prioriza variáveis de ambiente públicas e usa VERCEL_URL como fallback.
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
	const baseUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.NEXT_PUBLIC_BASE_URL ||
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

	return baseUrl.replace(/\/+$/, '')
}

/**
 * Retorna a URL completa de agendamento público do usuário.
 * Busca o token do usuário e monta a URL absoluta usando variáveis de ambiente.
 *
 * @param props - Propriedades da consulta
 * @returns URL completa de agendamento ou null se token não encontrado
 *
 * @example
 * ```typescript
 * const url = await getBookingUrl({ userId: "usr_123" });
 * // "https://agenda.exemplo.com/agendamento/joao-abc123"
 * ```
 */
export const getBookingUrl = async ({
	userId,
}: GetBookingUrlProps): Promise<string | null> => {
	try {
		const token = await getUserToken({ userId })
		if (!token) {
			return null
		}

		const baseUrl = getPublicBaseUrl()
		if (!baseUrl) {
			console.warn(
				'getBookingUrl: Variáveis de ambiente NEXT_PUBLIC_APP_URL ou NEXT_PUBLIC_BASE_URL não configuradas.',
			)
			return null
		}

		return `${baseUrl}/agendamento/${token}`
	} catch (error) {
		console.error('Erro ao gerar URL de agendamento:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
