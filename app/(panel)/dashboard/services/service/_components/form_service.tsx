/**
 * Componente - Form Service
 *
 * Visao geral:
 * - Componente React para Form Service.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/service/_components/form_service";
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
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
