/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Schema Zod e hook useFormAddress para formulário de endereço (CEP, logradouro, número, etc.).
 * Exporta FormAddressData e useFormAddress para uso em model-address.
 *
 * @example
 * ```tsx
 * const form = useFormAddress({ zip_code: "12345-678", street: "Rua X", ... });
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
/** Props do hook useFormAddress. */
interface UseFormAddressProps {
	/** CEP do endereço (pode ser null se não definido). */
	zip_code: string | null
	/** Logradouro (rua/avenida) */
	street: string | null
	/** Número do endereço */
	number: string | null
	/** Complemento (opcional) */
	complement: string | null
	/** Bairro do endereço */
	neighborhood: string | null
	/** Cidade/município */
	city: string | null
	/** Estado (UF) */
	state: string | null
	/** País */
	country: string | null
}
// Schema de validação para endereço usando Zod
const formSchema = z.object({
	// CEP é obrigatório e deve ter formato válido
	zip_code: z
		.string()
		.min(8, { message: 'CEP deve ter pelo menos 8 caracteres.' })
		.max(9, { message: 'CEP deve ter no máximo 9 caracteres.' })
		.regex(/^\d{5}-?\d{3}$/, {
			message: 'CEP deve estar no formato 00000-000 ou 00000000.',
		}),
	// Logradouro é obrigatório
	street: z
		.string()
		.min(3, { message: 'Logradouro deve ter pelo menos 3 caracteres.' })
		.max(100, { message: 'Logradouro deve ter no máximo 100 caracteres.' }),
	// Número é obrigatório (pode ser "S/N" para sem número)
	number: z
		.string()
		.min(1, { message: 'Número é obrigatório.' })
		.max(20, { message: 'Número deve ter no máximo 20 caracteres.' }),
	// Complemento é opcional
	complement: z
		.string()
		.max(50, { message: 'Complemento deve ter no máximo 50 caracteres.' })
		.optional(),
	// Bairro é obrigatório
	neighborhood: z
		.string()
		.min(2, { message: 'Bairro deve ter pelo menos 2 caracteres.' })
		.max(50, { message: 'Bairro deve ter no máximo 50 caracteres.' }),
	// Cidade é obrigatória
	city: z
		.string()
		.min(2, { message: 'Cidade deve ter pelo menos 2 caracteres.' })
		.max(50, { message: 'Cidade deve ter no máximo 50 caracteres.' }),
	// Estado é obrigatório e deve ser UF válida
	state: z
		.string()
		.length(2, { message: 'Estado deve ter exatamente 2 caracteres (UF).' })
		.regex(
			/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/i,
			{
				message: 'Estado deve ser uma UF válida (ex: SP, RJ, MG).',
			},
		),
	// País é obrigatório
	country: z
		.string()
		.min(2, { message: 'País deve ter pelo menos 2 caracteres.' })
		.max(50, { message: 'País deve ter no máximo 50 caracteres.' }),
})
// Tipo TypeScript inferido do schema Zod
export type FormAddressData = z.infer<typeof formSchema>
/**
 * Hook personalizado para formulário de endereço
 *
 * Configura o React Hook Form com validação Zod e valores padrão
 * baseados nos dados atuais do endereço do usuário.
 *
 * @param props - Propriedades com dados do endereço
 * @returns Instância configurada do React Hook Form
 *
 * @example
 * ```typescript
 * const form = useFormAddress({
 *   zip_code: "12345-678",
 *   street: "Rua das Flores",
 *   number: "123",
 *   neighborhood: "Centro",
 *   city: "São Paulo",
 *   state: "SP",
 *   country: "Brasil"
 * });
 * ```
 */
export const useFormAddress = ({
	zip_code,
	street,
	number,
	complement,
	neighborhood,
	city,
	state,
	country,
}: UseFormAddressProps) => {
	return useForm<FormAddressData>({
		// Utiliza Zod como resolvedor de validação
		resolver: zodResolver(formSchema),
		// Valores padrão do formulário
		defaultValues: {
			zip_code: zip_code || '',
			street: street || '',
			number: number || '',
			complement: complement || '',
			neighborhood: neighborhood || '',
			city: city || '',
			state: state || '',
			country: country || 'Brasil',
		},
		// Modo de validação: valida no submit e no blur
		mode: 'onBlur',
	})
}
