/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Data Access: busca dados da empresa (nome, token, horários por dia) pelo token_called para a página pública de agendamento.
 *
 * @example
 * const company = await getCompanyByToken({ token: 'joao-abc123' });
 */
'use server'
import prisma from '@/lib/prisma'
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
const TOKEN_REGEX = /^[a-z0-9-]+$/
const MAX_TOKEN_LENGTH = 100

export const getCompanyByToken = async ({ token }: GetCompanyByTokenProps) => {
	try {
		// Sanitiza o token: remove espaços e normaliza para minúsculas
		const sanitizedToken = token.trim().toLowerCase()
		
		if (
			!sanitizedToken ||
			sanitizedToken.length > MAX_TOKEN_LENGTH ||
			!TOKEN_REGEX.test(sanitizedToken)
		) {
			console.warn('getCompanyByToken: Token inválido', {
				original: token,
				sanitized: sanitizedToken,
				length: sanitizedToken?.length || 0,
				matchesRegex: sanitizedToken ? TOKEN_REGEX.test(sanitizedToken) : false,
			})
			return null
		}
		
		// Busca empresa pelo token (token_called é sempre salvo em minúsculas)
		const company = await prisma.user.findUnique({
			where: { token_called: sanitizedToken },
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
			// Log detalhado para debug em produção
			console.warn('getCompanyByToken: Empresa não encontrada', {
				searchToken: sanitizedToken,
				originalToken: token,
				tokenLength: sanitizedToken.length,
				firstChars: sanitizedToken.slice(0, 20),
			})
			
			// Tenta buscar com token original (caso raro onde token tenha case diferente)
			const originalTrimmed = token.trim()
			if (originalTrimmed !== sanitizedToken) {
				const fallbackCompany = await prisma.user.findUnique({
					where: { token_called: originalTrimmed },
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
				
				if (fallbackCompany) {
					console.info('getCompanyByToken: Empresa encontrada com token original', {
						searchToken: sanitizedToken,
						foundToken: fallbackCompany.token_called,
					})
					return fallbackCompany
				}
			}
			
			return null
		}
		
		return company
	} catch (error) {
		console.error('Erro ao buscar empresa por token:', {
			token,
			error: error instanceof Error ? error.message : error,
			stack: error instanceof Error ? error.stack : undefined,
		})
		return null
	}
}
