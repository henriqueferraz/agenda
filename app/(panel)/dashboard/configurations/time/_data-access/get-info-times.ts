/**
 * Data Access - Get Info Times
 *
 * Visao geral:
 * - Consulta de dados para Get Info Times.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/time/_data-access/get-info-times";
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
interface GetInfoTimesProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca informações completas dos horários do usuário
 *
 * Esta função é usada para carregar os horários de funcionamento
 * de cada dia da semana do usuário, permitindo a configuração
 * completa da disponibilidade.
 *
 * @param props - Propriedades da consulta
 * @returns Dados do usuário com horários ou null se não encontrado
 *
 * @example
 * ```typescript
 * const user = await getInfoTimes({ userId: "usr_123" });
 * console.log(user.mon_times); // ["08:00", "09:00", "10:00"]
 * console.log(user.sat_times); // [] (fechado aos sábados)
 * ```
 */
export const getInfoTimes = async ({ userId }: GetInfoTimesProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoTimes: userId não fornecido')
			return null
		}
		// Busca usuário no banco de dados com todos os campos necessários
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				// Relacionamento para contexto
				subscription: true,
			},
		})
		// Verifica se usuário foi encontrado
		if (!user) {
			console.warn(`getInfoTimes: Usuário ${userId} não encontrado`)
			return null
		}
		return user
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações de horários:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return null
	}
}
