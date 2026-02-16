/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Schema Zod e hook useFormActivity para formulário de atividade (categoria + como ser chamado).
 * Exporta FormActivityData e useFormActivity para uso em model-activity.
 *
 * @example
 * ```tsx
 * const form = useFormActivity({ activity: "Barbearia", be_called: "João" });
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
/** Props do hook useFormActivity. */
interface UseFormActivityProps {
	/** Atividade atual do usuário (pode ser null se não definida) */
	activity: string | null
	/** Como o usuário gostaria de ser chamado (pode ser null se não definido) */
	be_called: string | null
}
// Schema de validação usando Zod
const formSchema = z.object({
	activity: z
		.string()
		.min(1, {
			message: 'Selecione uma atividade.',
		})
		.refine(
			(value) => {
				// Validação adicional: verifica se é uma das atividades permitidas
				const allowedActivities = [
					'Barbearia',
					'Cabelereiro',
					'Manicure',
					'Maquiagem',
					'Petshop',
				]
				return allowedActivities.includes(value)
			},
			{
				message: 'Atividade inválida.',
			},
		),
	be_called: z
		.string()
		.min(1, {
			message: 'Este campo é obrigatório.',
		})
		.max(100, {
			message: 'O nome deve ter no máximo 100 caracteres.',
		}),
})
// Tipo TypeScript inferido do schema Zod
export type FormActivityData = z.infer<typeof formSchema>
/**
 * Hook personalizado para formulário de atividade
 *
 * Configura o React Hook Form com validação Zod e valores padrão
 * baseados na atividade atual do usuário.
 *
 * @param props - Propriedades do hook
 * @returns Instância configurada do React Hook Form
 *
 * @example
 * ```typescript
 * const form = useFormActivity({
 *   activity: "Barbearia",
 *   be_called: "João"
 * });
 * ```
 */
export const useFormActivity = ({
	activity,
	be_called,
}: UseFormActivityProps) => {
	return useForm<FormActivityData>({
		// Utiliza Zod como resolvedor de validação
		resolver: zodResolver(formSchema),
		// Valores padrão do formulário
		defaultValues: {
			// Se atividade existe e não é vazia, usa ela; senão undefined
			activity: activity && activity.trim() !== '' ? activity : undefined,
			// Se be_called existe e não é vazio, usa ele; senão undefined
			be_called: be_called && be_called.trim() !== '' ? be_called : undefined,
		},
		// Modo de validação: valida no submit e no blur
		mode: 'onBlur',
	})
}
