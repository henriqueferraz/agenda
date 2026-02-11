/**
 * Modulo de tokens genericos - Hashing, geracao aleatoria e OTP
 *
 * Fornece utilitarios criptograficos para gerar e validar tokens
 * usados em fluxos de autenticacao (reset de senha, OTP, refresh tokens).
 *
 * @example
 * import { hashToken, generateRandomToken, generateOtpCode } from '@/lib/tokens'
 *
 * const token = generateRandomToken()
 * const hashed = hashToken(token)
 * const otp = generateOtpCode() // '482931'
 */
import { createHash, randomBytes } from 'crypto'

/**
 * Gera hash SHA-256 de um token para armazenamento seguro no banco.
 * @param token - Token em texto puro a ser hasheado
 * @returns Hash hexadecimal do token
 * @example
 * const hashed = hashToken('abc123') // '6ca13d...'
 */
export const hashToken = (token: string) => {
	return createHash('sha256').update(token).digest('hex')
}

/**
 * Gera um token aleatorio criptograficamente seguro.
 * @param bytes - Numero de bytes aleatorios (default: 32, resulta em 64 caracteres hex)
 * @returns Token em formato hexadecimal
 * @example
 * const token = generateRandomToken()    // 64 caracteres
 * const short = generateRandomToken(16)  // 32 caracteres
 */
export const generateRandomToken = (bytes = 32) => {
	return randomBytes(bytes).toString('hex')
}

/**
 * Gera um codigo OTP numerico de 6 digitos.
 * @returns Codigo OTP como string (ex: '482931')
 * @example
 * const code = generateOtpCode() // '482931'
 */
export const generateOtpCode = () => {
	const code = Math.floor(100000 + Math.random() * 900000)
	return String(code)
}
