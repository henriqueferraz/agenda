/**
 * Data Access - Get Info Employee
 *
 * Visao geral:
 * - Consulta de dados para Get Info Employee.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/_data-access/get-info-employee";
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
interface GetInfoEmployeeProps {
	/** ID único do usuário */
	userId: string
}
/**
 * Busca lista de funcionários do usuário
 *
 * Esta função é usada para carregar todos os funcionários associados
 * a um usuário específico. Os funcionários são ordenados alfabeticamente por nome.
 *
 * @param props - Propriedades da consulta
 * @returns Lista de funcionários ou array vazio se nenhum encontrado
 *
 * @example
 * ```typescript
 * const employees = await getInfoEmployee({ userId: "usr_123" });
 * console.log(employees.length); // 5
 * console.log(employees[0].name); // "João Silva"
 * ```
 */
export const getInfoEmployee = async ({ userId }: GetInfoEmployeeProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	try {
		// Validação do parâmetro de entrada
		if (!userId) {
			console.warn('getInfoEmployee: userId não fornecido')
			return []
		}
		// Busca funcionários no banco de dados com serviços relacionados
		const employees = await prisma.employee.findMany({
			where: {
				UserId: userId,
			},
			include: {
				services: {
					include: {
						service: true,
					},
				},
			},
			orderBy: {
				name: 'asc', // Ordena alfabeticamente por nome
			},
		})
		return employees
	} catch (error) {
		// Log detalhado do erro para debugging
		console.error('Erro ao buscar informações de funcionários:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return []
	}
}
