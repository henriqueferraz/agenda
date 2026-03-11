/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-11
 * @modified 2026-03-11
 * @version 2026.03.11
 * @projectVersion 0.9.0
 */
/**
 * Data Access: verifica o status de configuração de cada item do guia de ajuda.
 * Retorna um objeto booleano indicando quais configurações já foram concluídas.
 *
 * @example
 * const status = await getConfigStatus({ userId: 'usr_123' });
 * console.log(status.activityConfigured); // true
 */
'use server'
import prisma from '@/lib/prisma'

interface GetConfigStatusProps {
	/** ID único do usuário */
	userId: string
}

/**
 * Status de configuração de cada item do guia.
 */
export interface ConfigStatus {
	/** Se a atividade foi configurada */
	activityConfigured: boolean
	/** Se o modelo (PF/PJ) foi configurado */
	modelConfigured: boolean
	/** Se o endereço foi configurado */
	addressConfigured: boolean
	/** Se os horários foram configurados */
	timesConfigured: boolean
	/** Se há pelo menos um serviço cadastrado */
	servicesConfigured: boolean
	/** Se há pelo menos um funcionário cadastrado */
	employeesConfigured: boolean
	/** Se as mensagens foram configuradas */
	messagesConfigured: boolean
}

/**
 * Verifica o status de configuração de cada item do guia de ajuda.
 *
 * @param props - Propriedades da consulta
 * @returns Status de configuração de cada item
 *
 * @example
 * ```typescript
 * const status = await getConfigStatus({ userId: "usr_123" });
 * if (status.activityConfigured) {
 *   console.log("Atividade já configurada");
 * }
 * ```
 */
export const getConfigStatus = async ({
	userId,
}: GetConfigStatusProps): Promise<ConfigStatus> => {
	try {
		if (!userId) {
			console.warn('getConfigStatus: userId não fornecido')
			return {
				activityConfigured: false,
				modelConfigured: false,
				addressConfigured: false,
				timesConfigured: false,
				servicesConfigured: false,
				employeesConfigured: false,
				messagesConfigured: false,
			}
		}

		// Busca usuário com todos os dados necessários
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
			include: {
				Address: true,
			},
		})

		if (!user) {
			return {
				activityConfigured: false,
				modelConfigured: false,
				addressConfigured: false,
				timesConfigured: false,
				servicesConfigured: false,
				employeesConfigured: false,
				messagesConfigured: false,
			}
		}

		// Busca serviços, funcionários e configuração de mensagens em paralelo
		const [services, employees, messageConfig] = await Promise.all([
			prisma.service.findMany({
				where: {
					UserId: userId,
					deletedAt: null,
				},
				take: 1, // Apenas precisa saber se existe pelo menos um
			}),
			prisma.employee.findMany({
				where: {
					UserId: userId,
					deletedAt: null,
				},
				take: 1, // Apenas precisa saber se existe pelo menos um
			}),
			prisma.messageConfig.findUnique({
				where: { userId },
			}),
		])

		// Verifica se atividade foi configurada
		const activityConfigured = !!user.activity && user.activity.trim() !== ''

		// Verifica se modelo foi configurado (nome + CPF ou CNPJ)
		const modelConfigured =
			!!user.name &&
			user.name.trim() !== '' &&
			(!!user.cpf || !!user.cnpj)

		// Verifica se endereço foi configurado
		const addressConfigured =
			!!user.Address &&
			!!user.Address.street &&
			user.Address.street.trim() !== '' &&
			!!user.Address.zip_code &&
			user.Address.zip_code.trim() !== ''

		// Verifica se pelo menos um dia da semana tem horários configurados
		const timesConfigured =
			(!!user.mon_times && user.mon_times.length > 0) ||
			(!!user.tue_times && user.tue_times.length > 0) ||
			(!!user.wed_times && user.wed_times.length > 0) ||
			(!!user.thu_times && user.thu_times.length > 0) ||
			(!!user.fri_times && user.fri_times.length > 0) ||
			(!!user.sat_times && user.sat_times.length > 0) ||
			(!!user.sun_times && user.sun_times.length > 0)

		// Verifica se há pelo menos um serviço cadastrado
		const servicesConfigured = services.length > 0

		// Verifica se há pelo menos um funcionário cadastrado
		const employeesConfigured = employees.length > 0

		// Verifica se mensagens foram configuradas (se existe registro no banco)
		const messagesConfigured = !!messageConfig && messageConfig.id !== ''

		return {
			activityConfigured,
			modelConfigured,
			addressConfigured,
			timesConfigured,
			servicesConfigured,
			employeesConfigured,
			messagesConfigured,
		}
	} catch (error) {
		console.error('Erro ao verificar status de configuração:', {
			userId,
			error: error instanceof Error ? error.message : error,
		})
		return {
			activityConfigured: false,
			modelConfigured: false,
			addressConfigured: false,
			timesConfigured: false,
			servicesConfigured: false,
			employeesConfigured: false,
			messagesConfigured: false,
		}
	}
}
