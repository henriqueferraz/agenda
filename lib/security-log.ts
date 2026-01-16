/**
 * Utilitario - Security Log
 *
 * Visao geral:
 * - Funcoes de suporte para Security Log.
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
 * import * as modulo from "@/lib/security-log";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import type { Prisma } from '@/lib/generated/prisma/client'
import prisma from '@/lib/prisma'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface SecurityLogInput {
	userId?: string
	email?: string
	ip?: string
	action: string
	metadata?: Prisma.InputJsonValue
}
export const logSecurityEvent = async ({
	userId,
	email,
	ip,
	action,
	metadata,
}: SecurityLogInput) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		await prisma.securityLog.create({
			data: {
				userId,
				email,
				ip,
				action,
				metadata,
			},
		})
	} catch (error) {
		console.error('Erro ao registrar log de segurança:', error)
	}
}
