/**
 * Data Access - Get Company By Token
 *
 * Visao geral:
 * - Consulta de dados para Get Company By Token.
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
 * import * as modulo from "@/app/(public)/agendamento/[token]/_data-access/get-company-by-token";
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
interface GetCompanyByTokenProps {
	/** Token único da empresa */
	token: string
}
/**
 *  Data Access Layer - Buscar Empresa por Token
 *
 * Camada de acesso a dados responsável por buscar informações da empresa
 * através do token único gerado a partir do campo be_called. Utilizado para
 * acesso público à página de agendamento.
 *
 * ## Funcionalidades
 * -  Busca de empresa por token único
 * -  Validação de token existente
 * -  Retorno de dados necessários para agendamento
 * -  Tratamento robusto de erros
 * -  Logging detalhado para debugging
 *
 * ## Estrutura de Dados Retornada
 * ```typescript
 * type CompanyData = {
 *   id: string;
 *   be_called: string;
 *   token_called: string;
 *   mon_times: string[];
 *   tue_times: string[];
 *   wed_times: string[];
 *   thu_times: string[];
 *   fri_times: string[];
 *   sat_times: string[];
 *   sun_times: string[];
 * } | null;
 * ```
 *
 * ## Cenários de Uso
 * - Acesso público à página de agendamento
 * - Validação de token antes de exibir calendário
 * - Carregamento de horários da empresa
 *
 * ## Segurança
 * - Validação de token obrigatória
 * - Proteção contra injeção SQL via Prisma
 * - Logs de auditoria para debugging
 * - Retorno apenas dos dados necessários
 *
 * @see {@link prisma.user.findUnique} - Método Prisma utilizado
 * @see {@link GetCompanyByTokenProps} - Interface de parâmetros
 */
/**
 * Busca empresa por token único
 *
 * Esta função é executada no servidor e busca a empresa através do token
 * único gerado a partir do campo be_called.
 *
 * @param props - Propriedades da consulta
 * @returns Dados da empresa ou null se não encontrado
 *
 * @example
 * ```typescript
 * const company = await getCompanyByToken({ token: "joao-abc123" });
 * if (company) {
 *   console.log(company.be_called); // "João"
 *   console.log(company.mon_times); // ["08:00", "09:00"]
 * }
 * ```
 */
export const getCompanyByToken = async ({ token }: GetCompanyByTokenProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		if (!token) {
			console.warn('getCompanyByToken: token não fornecido')
			return null
		}
		// Busca empresa pelo token
		const company = await prisma.user.findUnique({
			where: { token_called: token },
			select: {
				id: true,
				be_called: true,
				token_called: true,
				mon_times: true,
				tue_times: true,
				wed_times: true,
				thu_times: true,
				fri_times: true,
				sat_times: true,
				sun_times: true,
			},
		})
		if (!company) {
			console.warn(
				`getCompanyByToken: Empresa com token ${token} não encontrada`,
			)
			return null
		}
		return company
	} catch (error) {
		console.error('Erro ao buscar empresa por token:', {
			token,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
