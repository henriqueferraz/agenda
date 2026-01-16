/**
 * Componente - Form Fisica
 *
 * Visao geral:
 * - Componente React para Form Fisica.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/model/_components/form_fisica";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatCPF } from '@/utils/formatCPF'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface UseFormFisicaProps {
	/** Nome do usuário (pode ser null se não definido) */
	name: string | null
	/** CPF do usuário (opcional, pode ser null) */
	cpf: string | null
	/** Telefone do usuário (pode ser null se não definido) */
	phone: string | null
}
// Schema de validação para pessoa física usando Zod
const formSchema = z.object({
	// Nome é obrigatório e deve ter pelo menos 2 caracteres
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
 *   name: "João Silva",
 *   cpf: "123.456.789-00",
 *   phone: "(11) 99999-9999"
 * });
 * ```
 */
export const useFormFisica = ({ name, cpf, phone }: UseFormFisicaProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return useForm<FormFisicaData>({
		// Utiliza Zod como resolvedor de validação
		resolver: zodResolver(formSchema),
		// Valores padrão do formulário
		defaultValues: {
			name: name || '',
			cpf: cpf || '',
			phone: phone || '',
		},
		// Modo de validação: valida no submit e no blur
		mode: 'onBlur',
	})
}
