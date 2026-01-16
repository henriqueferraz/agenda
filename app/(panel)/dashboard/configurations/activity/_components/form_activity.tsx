/**
 * Componente - Form Activity
 *
 * Visao geral:
 * - Componente React para Form Activity.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Renderizar UI com props previsiveis.
 * - Isolar estilos e comportamento do componente.
 * - Facilitar reutilizacao em outras telas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/configurations/activity/_components/form_activity";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
