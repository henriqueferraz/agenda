/**
 * Data Access - Get Company Times
 *
 * Visao geral:
 * - Consulta de dados para Get Company Times.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/_data-access/get-company-times";
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
interface GetCompanyTimesProps {
	/** ID único do usuário (empresa) */
	userId: string
}
/**
 * Busca os horários de funcionamento da empresa
 *
 * @param props - Propriedades da consulta
 * @returns Horários da empresa ou null se não encontrado
 *
 * @example
 * ```typescript
 * const companyTimes = await getCompanyTimes({ userId: "usr_123" });
 * console.log(companyTimes.mon_times); // ["08:00", "09:00", "10:00"]
 * ```
 */
export const getCompanyTimes = async ({ userId }: GetCompanyTimesProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		if (!userId) {
			console.warn('getCompanyTimes: userId não fornecido')
			return null
		}
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				mon_times: true,
				tue_times: true,
				wed_times: true,
				thu_times: true,
				fri_times: true,
				sat_times: true,
				sun_times: true,
			},
		})
		if (!user) {
			console.warn(`getCompanyTimes: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		console.error('Erro ao buscar horários da empresa:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
