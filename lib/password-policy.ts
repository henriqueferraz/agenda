/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Modulo de politica de senhas - Validacao de complexidade
 *
 * Valida se uma senha atende aos requisitos minimos de seguranca:
 * minimo 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero e 1 especial.
 *
 * @example
 * import { validatePasswordPolicy } from '@/lib/password-policy'
 *
 * const result = validatePasswordPolicy('MinhaSenh@123')
 * // { valid: true }
 *
 * const invalid = validatePasswordPolicy('123')
 * // { valid: false, message: 'A senha deve ter no mínimo 8 caracteres.' }
 */

/**
 * Valida se uma senha atende a politica de complexidade.
 * Requisitos: min 8 caracteres, 1 maiuscula, 1 minuscula, 1 numero, 1 especial.
 * @param password - Senha a ser validada
 * @returns Objeto com { valid: boolean, message?: string }
 * @example
 * validatePasswordPolicy('Abc@1234') // { valid: true }
 * validatePasswordPolicy('abc')      // { valid: false, message: '...' }
 */
export const validatePasswordPolicy = (password: string) => {
	if (password.length < 8) {
		return { valid: false, message: 'A senha deve ter no mínimo 8 caracteres.' }
	}
	if (!/[A-Z]/.test(password)) {
		return {
			valid: false,
			message: 'A senha deve conter pelo menos 1 letra maiúscula.',
		}
	}
	if (!/[a-z]/.test(password)) {
		return {
			valid: false,
			message: 'A senha deve conter pelo menos 1 letra minúscula.',
		}
	}
	if (!/[0-9]/.test(password)) {
		return {
			valid: false,
			message: 'A senha deve conter pelo menos 1 número.',
		}
	}
	if (!/[^A-Za-z0-9]/.test(password)) {
		return {
			valid: false,
			message: 'A senha deve conter pelo menos 1 caractere especial.',
		}
	}
	return { valid: true }
}
