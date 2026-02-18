/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Componente de erro para a página de autogestão (F-08).
 * Exibe mensagens amigáveis para token inválido, agendamento cancelado ou expirado.
 *
 * @example
 * <ManagementError error="cancelled" />
 */
import React from 'react'
import { CalendarX2, Clock, SearchX } from 'lucide-react'

/** Tipo de erro possível na busca do agendamento. */
type ManagementErrorType = 'not_found' | 'cancelled' | 'expired'

/** Props do componente de erro. */
interface ManagementErrorProps {
	/** Tipo de erro retornado pelo data-access. */
	error: ManagementErrorType
}

/** Configurações de exibição por tipo de erro. */
const errorConfig: Record<ManagementErrorType, {
	icon: typeof CalendarX2
	title: string
	description: string
}> = {
	not_found: {
		icon: SearchX,
		title: 'Agendamento não encontrado',
		description: 'O link que você acessou é inválido ou o agendamento não existe. Verifique se o link está correto.',
	},
	cancelled: {
		icon: CalendarX2,
		title: 'Agendamento já cancelado',
		description: 'Este agendamento já foi cancelado anteriormente. Não é possível realizar novas alterações.',
	},
	expired: {
		icon: Clock,
		title: 'Agendamento expirado',
		description: 'O horário deste agendamento já passou. Não é mais possível cancelar ou reagendar.',
	},
}

/**
 * Exibe mensagem de erro amigável quando o agendamento não pode ser gerenciado.
 *
 * @param props - Tipo de erro ('not_found', 'cancelled', 'expired')
 * @returns JSX.Element
 */
export const ManagementError = ({ error }: ManagementErrorProps): React.ReactElement => {
	const config = errorConfig[error]
	const Icon = config.icon

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-lg sm:p-8">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 sm:h-20 sm:w-20">
					<Icon className="h-8 w-8 text-red-500 sm:h-10 sm:w-10" />
				</div>

				<h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
					{config.title}
				</h1>

				<p className="text-sm text-gray-600 sm:text-base">
					{config.description}
				</p>
			</div>
		</div>
	)
}
