/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Prisma
 *
 * Visao geral:
 * - Casos de teste para Prisma.
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
 * import * as modulo from "@/tests/__mocks__/prisma";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
type PrismaModelMock = Record<string, jest.Mock>
type PrismaMock = Record<string, PrismaModelMock>
const createModelMock = (): PrismaModelMock => {
	return new Proxy({} as PrismaModelMock, {
		get(target, prop) {
			const key = String(prop)
			if (!target[key]) {
				target[key] = jest.fn()
			}
			return target[key]
		},
	})
}
/**
 * Proxy do Prisma para testes. Gera mocks automaticamente para cada model
 * e implementa $transaction passando o proprio mock como argumento (tx).
 * $transaction nao e jest.fn para nao ser resetado por jest.clearAllMocks().
 */
const prismaMock = new Proxy({} as PrismaMock, {
	get(target, prop) {
		const key = String(prop)
		if (key === '$transaction') {
			return async (fn: (tx: PrismaMock) => Promise<unknown>) => fn(prismaMock)
		}
		if (!target[key]) {
			target[key] = createModelMock()
		}
		return target[key]
	},
})
export const resetPrismaMock = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	Object.values(prismaMock).forEach((modelMock) => {
		Object.values(modelMock).forEach((fn) => fn.mockReset())
	})
}
export default prismaMock
