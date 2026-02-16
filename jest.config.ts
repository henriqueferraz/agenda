/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Configuração do Jest: preset ts-jest, ambiente node, raiz em tests/,
 * mocks para Prisma e alias @/ para a raiz do projeto.
 */
import type { Config } from 'jest'
const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
	clearMocks: true,
	moduleNameMapper: {
		'^@/lib/prisma$': '<rootDir>/tests/__mocks__/prisma.ts',
		'^\\./prisma$': '<rootDir>/tests/__mocks__/prisma.ts',
		'^@/(.*)$': '<rootDir>/$1',
	},
	testPathIgnorePatterns: ['/node_modules/', '/.next/'],
}
export default config
