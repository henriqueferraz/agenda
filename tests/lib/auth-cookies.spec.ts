/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/auth-cookies.ts.
 * Valida setAuthCookies e clearAuthCookies em objeto tipo NextResponse.
 *
 * @example
 * npx jest tests/lib/auth-cookies.spec.ts
 */
import { NextResponse } from 'next/server'
import { setAuthCookies, clearAuthCookies } from '@/lib/auth-cookies'
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from '@/lib/jwt'

describe('auth-cookies', () => {
	describe('setAuthCookies', () => {
		test('sets auth_token and refresh_token with correct options', () => {
			const setMock = jest.fn()
			const response = {
				cookies: { set: setMock },
			} as unknown as NextResponse

			setAuthCookies(response, 'access-jwt', 'refresh-jwt')

			expect(setMock).toHaveBeenCalledWith(
				'auth_token',
				'access-jwt',
				expect.objectContaining({
					httpOnly: true,
					maxAge: ACCESS_TOKEN_MAX_AGE,
					path: '/',
				}),
			)
			expect(setMock).toHaveBeenCalledWith(
				'refresh_token',
				'refresh-jwt',
				expect.objectContaining({
					httpOnly: true,
					maxAge: REFRESH_TOKEN_MAX_AGE,
					path: '/',
				}),
			)
		})
	})

	describe('clearAuthCookies', () => {
		test('sets both cookies with maxAge: 0', () => {
			const setMock = jest.fn()
			const response = {
				cookies: { set: setMock },
			} as unknown as NextResponse

			clearAuthCookies(response)

			expect(setMock).toHaveBeenCalledWith(
				'auth_token',
				'',
				expect.objectContaining({ maxAge: 0 }),
			)
			expect(setMock).toHaveBeenCalledWith(
				'refresh_token',
				'',
				expect.objectContaining({ maxAge: 0 }),
			)
		})
	})
})
