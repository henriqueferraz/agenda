/**
 * Utilitario - Tokens
 *
 * Visao geral:
 * - Funcoes de suporte para Tokens.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Fornecer utilitarios de dominio ou infraestrutura.
 * - Padronizar formatos e regras reutilizaveis.
 * - Evitar duplicacao de logica.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/lib/tokens";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { createHash, randomBytes } from 'crypto'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const hashToken = (token: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return createHash('sha256').update(token).digest('hex')
}
export const generateRandomToken = (bytes = 32) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return randomBytes(bytes).toString('hex')
}
export const generateOtpCode = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const code = Math.floor(100000 + Math.random() * 900000)
	return String(code)
}
