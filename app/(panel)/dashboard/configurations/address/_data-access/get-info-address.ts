/**
 * Data Access - Get Info Address
 *
 * Visao geral:
 * - Consulta de dados para Get Info Address.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/address/_data-access/get-info-address";
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
interface GetInfoAddressProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações completas do usuário incluindo endereço e assinatura
 *
 * Esta função é usada para carregar os dados atuais do usuário
 * no formulário de edição de endereço comercial.
 *
 * @param props - Propriedades da consulta
 * @returns Dados completos do usuário com endereço ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoAddress({ userId: "usr_123" });
 * console.log(user.Address?.street); // "Rua das Flores"
 * console.log(user.Address?.zip_code);  // "12345-678"
 * ```
 */
export const getInfoAddress = async ({ userId }: GetInfoAddressProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoAddress: userId não fornecido')
			return null
		}
		// Busca usuário no banco de dados com relacionamentos de endereço e assinatura
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				Address: true, // Inclui dados do endereço se existir
				subscription: true, // Inclui dados da assinatura se existir
			},
		})
		// Verifica se usuário foi encontrado
		if (!user) {
			console.warn(`getInfoAddress: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações do endereço:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
