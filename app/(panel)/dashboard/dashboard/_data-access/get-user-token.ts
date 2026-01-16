/**
 * Data Access - Get User Token
 *
 * Visao geral:
 * - Consulta de dados para Get User Token.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Executar leitura de dados de forma segura.
 * - Aplicar filtros e ordenacoes de dominio.
 * - Garantir consistencia dos retornos.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/dashboard/_data-access/get-user-token";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use server'
import prisma from '@/lib/prisma'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface GetUserTokenProps {
	/** ID único do usuário */
	userId: string
}
/**
 *  Data Access Layer - Buscar Token de Agendamento Público
 *
 * Camada de acesso a dados responsável por buscar o token único
 * (token_called) do usuário para gerar a URL pública de agendamento.
 *
 * @param props - Propriedades da consulta
 * @returns Token único do usuário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const token = await getUserToken({ userId: "usr_123" });
 * if (token) {
 *   const url = `${process.env.NEXT_PUBLIC_BASE_URL}/agendamento/${token}`;
 * }
 * ```
 */
export const getUserToken = async ({
	userId,
}: GetUserTokenProps): Promise<string | null> => {
	try {
		if (!userId) {
			console.warn('getUserToken: userId não fornecido')
			return null
		}
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { token_called: true },
		})
		return user?.token_called || null
	} catch (error) {
		console.error('Erro ao buscar token do usuário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
