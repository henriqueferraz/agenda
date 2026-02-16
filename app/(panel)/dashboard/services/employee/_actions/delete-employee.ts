/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Server action que deleta um funcionário. Verifica autenticação e propriedade (funcionário do usuário),
 * remove o registro em Employee e revalida o cache da página de funcionários.
 *
 * @example
 * import { deleteEmployee } from "@/app/(panel)/dashboard/services/employee/_actions/delete-employee";
 * const result = await deleteEmployee("emp_123");
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
 * Deleta um funcionário do banco de dados
 *
 * Esta função realiza todas as validações necessárias e deleta um funcionário
 * do banco de dados. Inclui verificação de autenticação, verificação de propriedade,
 * verificação de agendamentos futuros vinculados (bloqueia exclusão se houver)
 * e tratamento de erros.
 *
 * @param employeeId - ID do funcionário a ser deletado
 * @returns Promise<ActionResponse> - Resposta de sucesso ou erro
 *
 * @example
 * ```typescript
 * const result = await deleteEmployee("emp_123");
 *
 * if (result.success) {
 *   console.log("Funcionário deletado:", result.message);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const deleteEmployee = async (
	employeeId: string,
): Promise<ActionResponse> => {
	let session
	try {
		// Verificação de autenticação
		session = await getUserFromToken()
		if (!session?.id) {
			console.warn('deleteEmployee: Usuário não autenticado')
			redirect('/')
		}
		// Validação do ID
		if (!employeeId || employeeId.trim() === '') {
			console.warn('deleteEmployee: ID do funcionário não fornecido')
			return {
				success: false,
				error: 'ID do funcionário é obrigatório',
			}
		}
		// Verificar se o funcionário existe e pertence ao usuário
		const employee = await prisma.employee.findUnique({
			where: { id: employeeId },
			select: { id: true, name: true, UserId: true },
		})
		if (!employee) {
			console.warn(`deleteEmployee: Funcionário não encontrado - ${employeeId}`)
			return {
				success: false,
				error: 'Funcionário não encontrado',
			}
		}
		// Verificar se o funcionário pertence ao usuário autenticado
		if (employee.UserId !== session.id) {
			console.warn(
				`deleteEmployee: Funcionário não pertence ao usuário - ${employeeId}`,
			)
			return {
				success: false,
				error: 'Você não tem permissão para deletar este funcionário',
			}
		}
		// Verificar se há agendamentos futuros vinculados ao funcionário
		const today = startOfDayInSaoPaulo(new Date())
		const futureAppointments = await prisma.appointment.count({
			where: {
				employeeId,
				appointmentDate: { gte: today },
			},
		})
		if (futureAppointments > 0) {
			return {
				success: false,
				error: `Não é possível deletar o funcionário "${employee.name}". Existem ${futureAppointments} agendamento(s) futuro(s) vinculado(s). Considere desativá-lo.`,
			}
		}
		// Soft-delete: marca como deletado em vez de remover do banco
		await prisma.employee.update({
			where: { id: employeeId },
			data: { deletedAt: new Date(), status: false },
		})
		// Revalidar cache da página de funcionários
		revalidatePath('/dashboard/services/employee')
		return {
			success: true,
			message: `Funcionário ${employee.name} removido com sucesso!`,
		}
	} catch (error) {
		// Log de erro genérico
		console.error('Erro interno ao deletar funcionário:', {
			userId: session?.id,
			employeeId,
			error: error instanceof Error ? error.message : error,
		})
		return {
			success: false,
			error: 'Erro interno do servidor. Tente novamente mais tarde.',
		}
	}
}
