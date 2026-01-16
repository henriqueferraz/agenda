/**
 * Componente - Form Juridica
 *
 * Visao geral:
 * - Componente React para Form Juridica.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/model/_components/form_juridica";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatCNPJ } from '@/utils/formatCNPJ'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface UseFormJuridicaProps {
	/** Nome da empresa (pode ser null se não definido) */
	name: string | null
	/** CNPJ da empresa (opcional, pode ser null) */
	cnpj: string | null
	/** Telefone da empresa (pode ser null se não definido) */
	phone: string | null
}
// Schema de validação para pessoa jurídica usando Zod
const formSchema = z.object({
	// Nome da empresa é obrigatório e deve ter pelo menos 2 caracteres
	name: z.string().min(2, { message: 'O nome é obrigatório.' }),
	// CNPJ é opcional, mas se informado deve ser válido
	cnpj: z
		.string()
		.optional()
		.refine(
			(cnpj) => {
				// Se não foi informado, é válido (opcional)
				if (!cnpj || cnpj.trim() === '') return true
				// Se foi informado, deve ter exatamente 14 dígitos numéricos
				if (cnpj.replace(/\D/g, '').length !== 14) {
					return false
				}
				// Valida o CNPJ usando o algoritmo oficial
				const { isValid } = formatCNPJ(cnpj)
				return isValid
			},
			{ message: 'CNPJ inválido. Informe um CNPJ válido ou deixe em branco.' },
		),
	// Telefone é obrigatório com mínimo de 10 caracteres
	phone: z.string().min(10, { message: 'O telefone é obrigatório.' }),
})
// Tipo TypeScript inferido do schema Zod
export type FormJuridicaData = z.infer<typeof formSchema>
/**
 * Hook personalizado para formulário de pessoa jurídica
 *
 * Configura o React Hook Form com validação Zod e valores padrão
 * baseados nos dados atuais da empresa.
 *
 * @param props - Propriedades com dados da empresa
 * @returns Instância configurada do React Hook Form
 *
 * @example
 * ```typescript
 * const form = useFormJuridica({
 *   name: "Empresa XYZ Ltda",
 *   cnpj: "11.222.333/0001-81",
 *   phone: "(11) 99999-9999"
 * });
 * ```
 */
export const useFormJuridica = ({
	name,
	cnpj,
	phone,
}: UseFormJuridicaProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return useForm<FormJuridicaData>({
		// Utiliza Zod como resolvedor de validação
		resolver: zodResolver(formSchema),
		// Valores padrão do formulário
		defaultValues: {
			name: name || '',
			cnpj: cnpj || '',
			phone: phone || '',
		},
		// Modo de validação: valida no submit e no blur
		mode: 'onBlur',
	})
}
