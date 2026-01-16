/**
 * Componente - Form Employee
 *
 * Visao geral:
 * - Componente React para Form Employee.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/_components/form_employee";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Schema de validação para funcionário
const employeeSchema = z.object({
	name: z
		.string()
		.min(2, 'Nome deve ter pelo menos 2 caracteres')
		.max(100, 'Nome deve ter no máximo 100 caracteres')
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
	email: z
		.string()
		.email('Email deve ter um formato válido')
		.max(255, 'Email deve ter no máximo 255 caracteres'),
	phone: z
		.string()
		.min(10, 'Telefone deve ter pelo menos 10 dígitos')
		.max(15, 'Telefone deve ter no máximo 15 caracteres')
		.regex(
			/^[\d\s\-\+\(\)]+$/,
			'Telefone deve conter apenas números, espaços e caracteres de formatação',
		),
	function: z
		.string()
		.min(2, 'Função deve ter pelo menos 2 caracteres')
		.max(100, 'Função deve ter no máximo 100 caracteres')
		.regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Função deve conter apenas letras e espaços'),
	serviceIds: z.array(z.string()),
})
export type EmployeeFormData = z.infer<typeof employeeSchema>
/**
 * Hook personalizado para gerenciamento do formulário de funcionário
 *
 * Configura React Hook Form com validação Zod, formatação automática
 * e configurações otimizadas para criação de funcionários.
 *
 * @returns Configuração completa do React Hook Form para funcionários
 */
export const useFormEmployee = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return useForm<EmployeeFormData>({
		resolver: zodResolver(employeeSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			function: '',
			serviceIds: [],
		},
		mode: 'onChange', // Validação em tempo real
		criteriaMode: 'all', // Mostrar todos os erros de validação
	})
}
