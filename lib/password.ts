/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Modulo de senhas - Hashing e verificacao com bcrypt
 *
 * Utiliza bcrypt com 12 rounds de salt para hashing seguro de senhas.
 * Usado nos fluxos de registro, login e alteracao de senha.
 *
 * @example
 * import { hashPassword, verifyPassword } from '@/lib/password'
 *
 * const hash = await hashPassword('MinhaSenh@123')
 * const isValid = await verifyPassword('MinhaSenh@123', hash) // true
 */
import bcrypt from 'bcrypt'

/** Numero de rounds de salt para o bcrypt (12 = ~250ms por hash) */
const SALT_ROUNDS = 12

/**
 * Gera hash bcrypt de uma senha em texto puro.
 * @param password - Senha em texto puro a ser hasheada
 * @returns Hash bcrypt da senha
 * @example
 * const hash = await hashPassword('MinhaSenh@123')
 */
export const hashPassword = async (password: string) => {
	return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compara uma senha em texto puro com um hash bcrypt.
 * @param password - Senha em texto puro
 * @param hash - Hash bcrypt armazenado no banco
 * @returns true se a senha corresponder ao hash
 * @example
 * const isValid = await verifyPassword('MinhaSenh@123', storedHash)
 */
export const verifyPassword = async (password: string, hash: string) => {
	return bcrypt.compare(password, hash)
}
