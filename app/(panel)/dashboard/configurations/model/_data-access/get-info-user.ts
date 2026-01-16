/**
 * Data Access - Get Info User
 *
 * Visao geral:
 * - Consulta de dados para Get Info User.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/model/_data-access/get-info-user";
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
interface GetInfoUserProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações completas do usuário incluindo assinatura
 *
 * Esta função é usada para carregar os dados atuais do usuário
 * nos formulários de edição de perfil (pessoa física/jurídica).
 *
 * @param props - Propriedades da consulta
 * @returns Dados completos do usuário ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoUser({ userId: "usr_123" });
 * console.log(user.name); // "João Silva"
 * console.log(user.cpf);  // "123.456.789-00"
 * ```
 */
export const getInfoUser = async ({ userId }: GetInfoUserProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoUser: userId não fornecido')
			return null
		}
		// Busca usuário no banco de dados com relacionamento de assinatura
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				subscription: true, // Inclui dados da assinatura se existir
			},
		})
		// Verifica se usuário foi encontrado
		if (!user) {
			console.warn(`getInfoUser: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações do usuário:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
