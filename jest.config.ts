/**
 * Configuracao - Jest.config
 *
 * Visao geral:
 * - Configuracao do Jest.config para o projeto.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Centralizar ajustes de ambiente e build.
 * - Padronizar defaults e overrides.
 * - Garantir consistencia entre ambientes.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/jest.config";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import type { Config } from 'jest'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
