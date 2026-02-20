/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Schema Zod e hook useFormFisica para formulário de pessoa física (nome fantasia, nome, CPF, telefone).
 * Exporta FormFisicaData e useFormFisica para uso em model-fisica.
 *
 * @example
 * ```tsx
 * const form = useFormFisica({ tradeName: "Barbearia do João", name: "João Silva", cpf: "123.456.789-00", phone: "(11) 99999-9999" });
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatCPF } from '@/utils/formatCPF'
/** Props do hook useFormFisica. */
interface UseFormFisicaProps {
	/** Nome fantasia da empresa (pode ser null se não definido). */
	tradeName: string | null
	/** Nome do usuário (pode ser null se não definido). */
	name: string | null
	/** CPF do usuário (opcional, pode ser null). */
	cpf: string | null
	/** Telefone do usuário (pode ser null se não definido). */
	phone: string | null
}
// Schema de validação para pessoa física usando Zod
const formSchema = z.object({
	tradeName: z
		.string()
		.max(100, { message: 'O nome fantasia deve ter no máximo 100 caracteres.' })
		.optional(),
	name: z.string().min(2, { message: 'O nome é obrigatório.' }),
	// CPF é opcional, mas se informado deve ser válido
	cpf: z
		.string()
		.optional()
		.refine(
			(cpf) => {
				// Se não foi informado, é válido (opcional)
				if (!cpf || cpf.trim() === '') return true
				// Se foi informado, deve ter exatamente 11 dígitos numéricos
				if (cpf.replace(/\D/g, '').length !== 11) {
					return false
				}
				// Valida o CPF usando o algoritmo oficial
				const { isValid } = formatCPF(cpf)
				return isValid
			},
			{ message: 'CPF inválido. Informe um CPF válido ou deixe em branco.' },
		),
	// Telefone é obrigatório com mínimo de 10 caracteres
	phone: z.string().min(10, { message: 'O telefone é obrigatório.' }),
})
// Tipo TypeScript inferido do schema Zod
export type FormFisicaData = z.infer<typeof formSchema>
/**
 * Hook personalizado para formulário de pessoa física
 *
 * Configura o React Hook Form com validação Zod e valores padrão
 * baseados nos dados atuais do usuário.
 *
 * @param props - Propriedades com dados do usuário
 * @returns Instância configurada do React Hook Form
 *
 * @example
 * ```typescript
 * const form = useFormFisica({
 *   tradeName: "Barbearia do João",
 *   name: "João Silva",
 *   cpf: "123.456.789-00",
 *   phone: "(11) 99999-9999"
 * });
 * ```
 */
export const useFormFisica = ({ tradeName, name, cpf, phone }: UseFormFisicaProps) => {
	return useForm<FormFisicaData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			tradeName: tradeName || '',
			name: name || '',
			cpf: cpf || '',
			phone: phone || '',
		},
		// Modo de validação: valida no submit e no blur
		mode: 'onBlur',
	})
}
