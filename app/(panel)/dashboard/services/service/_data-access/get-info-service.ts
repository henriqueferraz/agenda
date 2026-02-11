/**
 * Consulta de serviços associados a um usuário.
 *
 * Busca todos os serviços cadastrados por um usuário específico no banco de dados,
 * ordenados alfabeticamente por nome. Retorna array vazio em caso de erro ou quando
 * nenhum serviço é encontrado.
 *
 * @example
 * ```typescript
 * import { getInfoService } from '@/app/(panel)/dashboard/services/service/_data-access/get-info-service';
 *
 * const services = await getInfoService({ userId: "usr_123" });
 * console.log(services.length); // 5
 * ```
 */
'use server'
import prisma from '@/lib/prisma'

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
