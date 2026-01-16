/**
 * Data Access - Get Info Service
 *
 * Visao geral:
 * - Consulta de dados para Get Info Service.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/service/_data-access/get_info_service";
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
interface GetInfoServiceProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca lista de serviços do usuário
 *
 * Esta função é executada no servidor e busca todos os serviços associados
 * a um usuário específico. Os serviços são ordenados alfabeticamente por nome.
 *
 * @param props - Propriedades da consulta
 * @returns Lista de serviços ou array vazio se nenhum encontrado
 *
 * @example
 * ```typescript
 * const services = await getInfoService({ userId: "usr_123" });
 * console.log(services.length); // 5
 * console.log(services[0].name); // "Corte de Cabelo"
 * ```
 */
export const getInfoService = async ({ userId }: GetInfoServiceProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoService: userId não fornecido')
			return []
		}
		// Busca serviços no banco de dados ordenados por nome
		const services = await prisma.service.findMany({
			where: {
				UserId: userId,
			},
			orderBy: {
				name: 'asc',
			},
		})
		return services
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações de serviços:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
