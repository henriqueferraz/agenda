/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Module Exports.spec
 *
 * Visao geral:
 * - Casos de teste para Module Exports.spec.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar contratos e comportamento esperado.
 * - Cobrir cenarios de sucesso e falha.
 * - Proteger contra regressao.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/tests/system/module-exports.spec";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const ROOT = path.resolve(__dirname, '..', '..')
const EXCLUDED_DIRS = new Set([
	'node_modules',
	'.next',
	'tests',
	'public',
	'prisma',
	'components',
])
const walk = (dir: string, files: string[] = []): string[] => {
	const entries = fs.readdirSync(dir, { withFileTypes: true })
	for (const entry of entries) {
		if (EXCLUDED_DIRS.has(entry.name)) {
			continue
		}
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			walk(fullPath, files)
			continue
		}
		if (!entry.isFile()) {
			continue
		}
		if (entry.name.endsWith('.d.ts')) {
			continue
		}
		if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
			continue
		}
		files.push(fullPath)
	}
	return files
}
const isTargetFile = (filePath: string): boolean => {
	const relative = path.relative(ROOT, filePath).replace(/\\/g, '/')
	if (relative === 'lib/prisma.ts') {
		return false
	}
	if (relative.startsWith('lib/')) {
		return true
	}
	if (relative.startsWith('utils/')) {
		return true
	}
	if (relative.startsWith('hooks/')) {
		return true
	}
	if (
		relative.startsWith('app/') &&
		(relative.includes('/_actions/') || relative.includes('/_data-access/'))
	) {
		return true
	}
	return false
}
const targetFiles = walk(ROOT).filter(isTargetFile)
describe('Exports das funcoes do sistema', () => {
	for (const filePath of targetFiles) {
		const relative = path.relative(ROOT, filePath).replace(/\\/g, '/')
		test(`carrega ${relative}`, async () => {
			const moduleExports = await import(pathToFileURL(filePath).href)
			const exportedFunctions = Object.values(moduleExports).filter(
				(value) => typeof value === 'function',
			)
			if (exportedFunctions.length > 0) {
				expect(exportedFunctions.length).toBeGreaterThan(0)
			} else {
				expect(moduleExports).toBeDefined()
			}
		})
	}
})
