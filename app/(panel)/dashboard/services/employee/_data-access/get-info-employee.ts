/**
 * Data Access: busca todos os funcionários do usuário com serviços relacionados, ordenados por nome.
 *
 * @example
 * const employees = await getInfoEmployee({ userId: 'usr_123' });
 */
'use server'
import prisma from '@/lib/prisma'
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
