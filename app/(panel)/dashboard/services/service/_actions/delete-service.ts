/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que deleta um serviço. Verifica autenticação e propriedade (serviço do usuário),
 * remove o registro em Service e revalida o cache da página de serviços.
 *
 * @example
 * import { deleteService } from "@/app/(panel)/dashboard/services/service/_actions/delete-service";
 * const result = await deleteService("srv_123");
 */
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'
import { startOfDayInSaoPaulo } from '@/utils/date-timezone'
// Tipo de resposta das ações
type ActionResponse = {
	success: boolean
	message?: string
	error?: string
}
/**
 * Deleta um serviço do banco de dados
 *
 * Esta função é executada no servidor e realiza:
 * 1. Validação de autenticação
 * 2. Verificação de existência (serviço existe)
 * 3. Verificação de propriedade (serviço pertence ao usuário)
 * 4. Verificação de agendamentos futuros vinculados (bloqueia exclusão se houver)
 * 5. Exclusão no banco de dados
 * 6. Revalidação do cache
 *
 * @param serviceId - ID do serviço a ser deletado
 * @returns Promise<ActionResponse> - Resposta de sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await deleteService("srv_123");
 *
 * if (result.success) {
 *   console.log("Serviço deletado:", result.message);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const deleteService = async (
	serviceId: string,
): Promise<ActionResponse> => {
	let session
	try {
		// Verificação de autenticação
		session = await getUserFromToken()
		if (!session?.id) {
			console.warn('deleteService: Usuário não autenticado')
			redirect('/')
		}
		// Validação do ID
		if (!serviceId || serviceId.trim() === '') {
			console.warn('deleteService: ID do serviço não fornecido')
			return {
				success: false,
				error: 'ID do serviço é obrigatório',
			}
		}
		// Verificar se o serviço existe e pertence ao usuário
		const service = await prisma.service.findUnique({
			where: { id: serviceId },
			select: { id: true, name: true, UserId: true },
		})
		if (!service) {
			console.warn(`deleteService: Serviço não encontrado - ${serviceId}`)
			return {
				success: false,
				error: 'Serviço não encontrado',
			}
		}
		// Verificar se o serviço pertence ao usuário autenticado
		if (service.UserId !== session.id) {
			console.warn(
				`deleteService: Serviço não pertence ao usuário - ${serviceId}`,
			)
			return {
				success: false,
				error: 'Você não tem permissão para deletar este serviço',
			}
		}
		// Verificar se há agendamentos futuros vinculados ao serviço
		const today = startOfDayInSaoPaulo(new Date())
		const futureAppointments = await prisma.appointment.count({
			where: {
				serviceId,
				appointmentDate: { gte: today },
			},
		})
		if (futureAppointments > 0) {
			return {
				success: false,
				error: `Não é possível deletar o serviço "${service.name}". Existem ${futureAppointments} agendamento(s) futuro(s) vinculado(s). Considere desativá-lo.`,
			}
		}
		// Soft-delete: marca como deletado em vez de remover do banco
		await prisma.service.update({
			where: { id: serviceId },
			data: { deletedAt: new Date(), status: false },
		})
		// Revalidar cache da página de serviços
		revalidatePath('/dashboard/services/service')
		return {
			success: true,
			message: `Serviço ${service.name} removido com sucesso!`,
		}
	} catch (error) {
		// Log de erro genérico
		console.error('Erro interno ao deletar serviço:', {
			userId: session?.id,
			serviceId,
			error: error instanceof Error ? error.message : error,
		})
		return {
			success: false,
			error: 'Erro interno do servidor. Tente novamente mais tarde.',
		}
	}
}
