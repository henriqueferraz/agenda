/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Modulo de JWT - Geracao e verificacao de tokens
 *
 * Gerencia access tokens (30min) e refresh tokens (24h) usando jsonwebtoken.
 * Utiliza algoritmo HS256 com chaves secretas separadas para cada tipo de token.
 * Inclui role (master/enterprise) e trialEndsAt no payload para controle de acesso.
 *
 * @example
 * import { signAccessToken, verifyAccessToken } from '@/lib/jwt'
 *
 * const token = signAccessToken({ sub: 'user_123', email: 'user@email.com', role: 'enterprise', trialEndsAt: '2026-03-22T00:00:00.000Z' })
 * const payload = verifyAccessToken(token)
 */
import jwt from 'jsonwebtoken'

/** Payload padrao dos tokens JWT de autenticacao */
export interface AuthTokenPayload {
	/** ID unico do usuario */
	sub: string
	/** Email do usuario */
	email: string
	/** Nome do usuario (opcional) */
	name?: string | null
	/** Role do usuario (master ou enterprise) */
	role: 'master' | 'enterprise'
	/** Data de fim do trial em ISO string (null para master) */
	trialEndsAt?: string | null
}

/** Tempo de expiracao do access token (30 minutos) */
const ACCESS_EXPIRES_IN = '30m'
/** Tempo de expiracao do refresh token (24 horas) */
const REFRESH_EXPIRES_IN = '24h'

/**
 * Obtem a chave secreta para access tokens.
 * @returns Chave secreta JWT_SECRET
 * @throws Error se JWT_SECRET nao estiver configurado
 */
const getAccessSecret = () => {
	const secret = process.env.JWT_SECRET
	if (!secret) {
		throw new Error('JWT_SECRET não está configurado')
	}
	return secret
}

/**
 * Obtem a chave secreta para refresh tokens.
 * @returns Chave secreta JWT_REFRESH_SECRET
 * @throws Error se JWT_REFRESH_SECRET nao estiver configurado
 */
const getRefreshSecret = () => {
	const secret = process.env.JWT_REFRESH_SECRET
	if (!secret) {
		throw new Error('JWT_REFRESH_SECRET não está configurado')
	}
	return secret
}

/**
 * Assina um access token JWT com expiracao de 30 minutos.
 * @param payload - Dados do usuario (sub, email, name)
 * @returns Token JWT assinado
 * @example
 * const token = signAccessToken({ sub: 'user_123', email: 'user@email.com' })
 */
export const signAccessToken = (payload: AuthTokenPayload) => {
	return jwt.sign(payload, getAccessSecret(), {
		expiresIn: ACCESS_EXPIRES_IN,
		algorithm: 'HS256',
	})
}

/**
 * Assina um refresh token JWT com expiracao de 24 horas.
 * @param payload - Dados do usuario (sub, email, name)
 * @returns Token JWT assinado
 * @example
 * const token = signRefreshToken({ sub: 'user_123', email: 'user@email.com' })
 */
export const signRefreshToken = (payload: AuthTokenPayload) => {
	return jwt.sign(payload, getRefreshSecret(), {
		expiresIn: REFRESH_EXPIRES_IN,
		algorithm: 'HS256',
	})
}

/**
 * Verifica e decodifica um access token JWT.
 * @param token - Token JWT a ser verificado
 * @returns Payload decodificado com sub, email e name
 * @throws JsonWebTokenError se o token for invalido ou expirado
 * @example
 * const payload = verifyAccessToken(token)
 * console.log(payload.sub) // 'user_123'
 */
export const verifyAccessToken = (token: string) => {
	return jwt.verify(token, getAccessSecret(), {
		algorithms: ['HS256'],
	}) as AuthTokenPayload
}

/**
 * Verifica e decodifica um refresh token JWT.
 * @param token - Token JWT a ser verificado
 * @returns Payload decodificado com sub, email e name
 * @throws JsonWebTokenError se o token for invalido ou expirado
 * @example
 * const payload = verifyRefreshToken(token)
 * console.log(payload.sub) // 'user_123'
 */
export const verifyRefreshToken = (token: string) => {
	return jwt.verify(token, getRefreshSecret(), {
		algorithms: ['HS256'],
	}) as AuthTokenPayload
}

/** Tempo maximo do cookie de access token em segundos (30 minutos) */
export const ACCESS_TOKEN_MAX_AGE = 60 * 30
/** Tempo maximo do cookie de refresh token em segundos (24 horas) */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24
/** Tempo de expiracao do refresh token em milissegundos (24 horas) — usado no Prisma ao persistir tokens */
export const REFRESH_EXPIRES_MS = 24 * 60 * 60 * 1000
