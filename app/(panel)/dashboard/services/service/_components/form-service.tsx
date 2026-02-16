/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Hook e schema de validação para formulário de serviço.
 *
 * Define schema Zod para validação de dados de serviço (nome, preço, horas e minutos)
 * com validações de duração mínima (1 minuto) e máxima (8 horas). Hook React Hook Form
 * configurado com validação em tempo real e valores padrão otimizados.
 *
 * @example
 * ```typescript
 * import { useFormService, ServiceFormData } from '@/app/(panel)/dashboard/services/service/_components/form-service';
 *
 * const form = useFormService();
 * const onSubmit = (data: ServiceFormData) => { ... };
 * ```
 */
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Schema de validação para serviço
const serviceSchema = z
	.object({
		name: z
			.string()
			.min(2, 'Nome deve ter pelo menos 2 caracteres')
			.max(100, 'Nome deve ter no máximo 100 caracteres')
			.regex(
				/^[a-zA-ZÀ-ÿ0-9\s\-]+$/,
				'Nome deve conter apenas letras, números, espaços e hífens',
			),
		price: z
			.number()
			.min(0.01, 'Preço deve ser pelo menos R$ 0,01')
			.max(10000, 'Preço máximo é R$ 10.000,00'),
		hours: z
			.number()
			.min(0, 'Horas não pode ser negativo')
			.max(8, 'Máximo 8 horas')
			.int('Horas deve ser um número inteiro'),
		minutes: z
			.number()
			.min(0, 'Minutos não pode ser negativo')
			.max(59, 'Minutos deve ser entre 0 e 59')
			.int('Minutos deve ser um número inteiro'),
	})
	.refine(
		(data) => {
			// Validar que a duração total seja pelo menos 1 minuto
			const totalMinutes = data.hours * 60 + data.minutes
			return totalMinutes >= 1
		},
		{
			message: 'Duração total deve ser pelo menos 1 minuto',
			path: ['minutes'],
		},
	)
	.refine(
		(data) => {
			// Validar que a duração total não exceda 480 minutos (8 horas)
			const totalMinutes = data.hours * 60 + data.minutes
			return totalMinutes <= 480
		},
		{
			message: 'Duração total máxima é 480 minutos (8 horas)',
			path: ['minutes'],
		},
	)
export type ServiceFormData = z.infer<typeof serviceSchema>
/**
 * Hook personalizado para gerenciamento do formulário de serviço
 *
 * Configura React Hook Form com validação Zod e configurações
 * otimizadas para criação de serviços.
 *
 * @returns Configuração completa do React Hook Form para serviços
 */
export const useFormService = () => {
	return useForm<ServiceFormData>({
		resolver: zodResolver(serviceSchema),
		defaultValues: {
			name: '',
			price: 0,
			hours: 0,
			minutes: 30,
		},
		mode: 'onChange', // Validação em tempo real
		criteriaMode: 'all', // Mostrar todos os erros de validação
	})
}
