/**
 * Hook e schema de validação para formulário de funcionário.
 *
 * Define schema Zod para validação de dados de funcionário (nome, email, telefone,
 * função e serviços associados) e hook React Hook Form configurado com validação
 * em tempo real e tratamento de erros.
 *
 * @example
 * ```typescript
 * import { useFormEmployee, EmployeeFormData } from '@/app/(panel)/dashboard/services/employee/_components/form-employee';
 *
 * const form = useFormEmployee();
 * const onSubmit = (data: EmployeeFormData) => { ... };
 * ```
 */
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
