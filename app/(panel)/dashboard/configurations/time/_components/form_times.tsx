/**
 * Componente - Form Times
 *
 * Visao geral:
 * - Componente React para Form Times.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/time/_components/form_times";
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
interface UseFormTimesProps {
	/** Horários de segunda-feira */
	mon_times?: string[] | null
	/** Horários de terça-feira */
	tue_times?: string[] | null
	/** Horários de quarta-feira */
	wed_times?: string[] | null
	/** Horários de quinta-feira */
	thu_times?: string[] | null
	/** Horários de sexta-feira */
	fri_times?: string[] | null
	/** Horários de sábado */
	sat_times?: string[] | null
	/** Horários de domingo */
	sun_times?: string[] | null
}
// Validação de horário no formato HH:MM
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
// Schema de validação para horários
const formSchema = z.object({
	// Cada dia da semana é um array de strings (horários) - opcional
	mon_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
	tue_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
	wed_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
	thu_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
	fri_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
	sat_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
	sun_times: z
		.array(z.string().regex(timeRegex, 'Horário deve estar no formato HH:MM'))
		.optional(),
})
// Tipo TypeScript inferido do schema Zod
export type FormTimesData = z.infer<typeof formSchema>
/**
 * Hook personalizado para formulário de horários
 *
 * Configura o React Hook Form com validação Zod e valores padrão
 * baseados nos horários atuais do usuário por dia da semana.
 *
 * @param props - Propriedades com horários de cada dia
 * @returns Instância configurada do React Hook Form
 *
 * @example
 * ```typescript
 * const form = useFormTimes({
 *   mon_times: ["08:00", "09:00", "10:00"],
 *   fri_times: ["14:00", "15:00"],
 *   sat_times: [], // fechado aos sábados
 *   sun_times: ["10:00"] // apenas um horário aos domingos
 * });
 * ```
 */
export const useFormTimes = ({
	mon_times,
	tue_times,
	wed_times,
	thu_times,
	fri_times,
	sat_times,
	sun_times,
}: UseFormTimesProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	return useForm<FormTimesData>({
		// Utiliza Zod como resolvedor de validação
		resolver: zodResolver(formSchema),
		// Valores padrão do formulário
		defaultValues: {
			mon_times: mon_times || [],
			tue_times: tue_times || [],
			wed_times: wed_times || [],
			thu_times: thu_times || [],
			fri_times: fri_times || [],
			sat_times: sat_times || [],
			sun_times: sun_times || [],
		},
		// Modo de validação: valida em tempo real
		mode: 'onChange',
	})
}
/**
 * Utilitários para manipulação de horários
 */
// Formatar horário para o padrão HH:MM
export const formatTime = (time: string): string => {
	if (!timeRegex.test(time)) {
		throw new Error('Horário deve estar no formato HH:MM')
	}
	const [hours, minutes] = time.split(':')
	return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}
// Validar se horário é válido
export const isValidTime = (time: string): boolean => {
	return timeRegex.test(time)
}
// Ordenar horários cronologicamente
export const sortTimes = (times: string[]): string[] => {
	return times.sort((a, b) => {
		const [aHours, aMinutes] = a.split(':').map(Number)
		const [bHours, bMinutes] = b.split(':').map(Number)
		if (aHours !== bHours) {
			return aHours - bHours
		}
		return aMinutes - bMinutes
	})
}
// Remover horários duplicados
export const removeDuplicateTimes = (times: string[]): string[] => {
	return Array.from(new Set(times))
}
// Copiar horários de um dia para outro
export const copyTimesFromDay = (sourceTimes: string[]): string[] => {
	return [...sourceTimes]
}
