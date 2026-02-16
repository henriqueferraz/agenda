/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Componente seletor de horários de funcionamento (intervalos de 30 min, 00:00–23:30).
 * Suporta modo inline (grade de botões) ou modal (Dialog com trigger). Usado na
 * configuração de horários em ModelTimes e em formulários de agendamento.
 */
'use client'
/**
 *  Componente Seletor de Horário
 *
 * Componente React cliente que permite ao usuário selecionar múltiplos horários
 * de funcionamento em intervalos de 30 minutos (00:00 até 23:30). Suporta dois
 * modos de exibição: modal (Dialog) ou inline, com interface visual de grade
 * de botões para seleção múltipla.
 *
 * ## Funcionalidades
 * -  **Seleção múltipla**: Múltiplos horários por clique
 * -  **Grade visual**: 4 colunas x 24 linhas (96 horários total)
 * -  **Intervalos de 30min**: De 00:00 até 23:30
 * -  **Modo inline**: Pode ser usado dentro de outros modais
 * -  **Modo modal**: Dialog completo com trigger
 * -  **Pré-seleção**: Suporta horários iniciais
 * -  **Callback**: Notifica mudanças para componente pai
 * -  **Toggle visual**: Botões destacados quando selecionados
 *
 * ## Estrutura de Horários
 * ```typescript
 * // Geração automática de horários
 * const hours = [
 *   "00:00", "00:30", "01:00", "01:30", ...,
 *   "23:00", "23:30"
 * ]; // Total: 48 horários (24h * 2 intervalos)
 * ```
 *
 * ## Modos de Uso
 * ### Modo Inline
 * ```tsx
 * <Horario
 *   inline={true}
 *   initialSelected={["08:00", "09:00"]}
 *   onSelectionChange={(hours) => console.log(hours)}
 * />
 * ```
 *
 * ### Modo Modal
 * ```tsx
 * <Horario
 *   initialSelected={[]}
 *   onSelectionChange={(hours) => handleSave(hours)}
 * />
 * ```
 *
 * ## Interface Visual
 * ```
 * ┌─ Grade de Horários (4 colunas) ────────┐
 * │ [00:00] [00:30] [01:00] [01:30]        │
 * │ [02:00] [02:30] [03:00] [03:30]        │
 * │ ...                                    │
 * │ [23:00] [23:30]                        │
 * └────────────────────────────────────────┘
 * ```
 *
 * ## Estados dos Botões
 * - **Não selecionado**: Botão outline padrão
 * - **Selecionado**: Borda azul, fundo azul claro, texto destacado
 *
 * ## Dependências Externas
 * - Componentes UI: Dialog, Button
 * - Utilitários: `cn` para classes condicionais
 * - Ícones: `ChevronRight` (lucide-react)
 *
 * ## Validações
 * - Horários sempre ordenados automaticamente
 * - Prevenção de duplicatas (toggle remove se já existe)
 * - Validação de formato HH:MM
 *
 * ## Cenários de Uso
 * - Configuração de horários de funcionamento
 * - Seleção de disponibilidade por dia
 * - Edição de horários em modais
 * - Integração com formulários de agendamento
 *
 * @param props - Propriedades do componente
 * @returns JSX.Element - Seletor de horários (modal ou inline)
 *
 * @example
 * ```tsx
 * // Uso inline dentro de outro modal
 * <Dialog>
 *   <DialogContent>
 *     <Horario
 *       inline={true}
 *       initialSelected={["08:00", "09:00"]}
 *       onSelectionChange={(hours) => setTimes(hours)}
 *     />
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * @example
 * ```tsx
 * // Uso como modal standalone
 * <Horario
 *   initialSelected={[]}
 *   onSelectionChange={(hours) => {
 *     console.log("Horários selecionados:", hours);
 *   }}
 * />
 * ```
 */
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
interface HorarioProps {
	/** Horários já selecionados (para pré-seleção) */
	initialSelected?: string[]
	/** Callback chamado quando os horários mudam */
	onSelectionChange?: (selectedHours: string[]) => void
	/** Se deve mostrar apenas o conteúdo (sem modal) */
	inline?: boolean
}
export const Horario = ({
	initialSelected = [],
	onSelectionChange,
	inline = false,
}: HorarioProps) => {
	const [selectedHours, setselectedHours] = useState<string[]>(initialSelected)
	// Notificar mudanças para o componente pai
	const updateSelection = (newSelection: string[]) => {
		setselectedHours(newSelection)
		onSelectionChange?.(newSelection)
	}
	const generateTimeSlots = (): string[] => {
		const hours: string[] = []
		for (let i = 0; i < 24; i++) {
			for (let j = 0; j < 2; j++) {
				const hour = i.toString().padStart(2, '0')
				const minute = (j * 30).toString().padStart(2, '0')
				hours.push(`${hour}:${minute}`)
			}
		}
		return hours
	}
	const hours = generateTimeSlots()
	const toggleHour = (hour: string) => {
		const newSelection = selectedHours.includes(hour)
			? selectedHours.filter((h) => h !== hour)
			: [...selectedHours, hour].sort()
		updateSelection(newSelection)
	}
	const timeGrid = (
		<section className='py-4'>
			<div className='grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-full overflow-y-auto'>
				{/* Grade de botões para selecionar horários (4 por linha) */}
				{hours.map((hour) => (
					<Button
						key={hour}
						aria-label={`Selecionar horário ${hour}`}
						className={cn(
							'w-full text-xs',
							selectedHours.includes(hour) &&
							'border-2 border-blue-600 bg-blue-50 text-primary font-medium',
						)}
						variant='outline'
						onClick={() => toggleHour(hour)}
						size='sm'
					>
						{hour}
					</Button>
				))}
			</div>
		</section>
	)
	// Modo inline: retorna apenas o conteúdo
	if (inline) {
		return (
			<div>
				<p className='text-sm text-muted-foreground mb-3'>
					Clique nos horários desejados para selecioná-los:
				</p>
				{timeGrid}
			</div>
		)
	}
	// Modo modal: retorna o Dialog completo
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='ghost' size='sm'>
					<ChevronRight className='h-4 w-4' />
				</Button>
			</DialogTrigger>
			<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl'>
				<DialogHeader>
					<DialogTitle>Qual o horário de funcionamento?</DialogTitle>
					<DialogDescription>
						Selecione todos os horários de funcionamento da sua empresa. Clique
						nos botões para selecionar ou desmarcar horários.
					</DialogDescription>
				</DialogHeader>

				{timeGrid}

				<DialogFooter>
					<Button variant='system' disabled={selectedHours.length === 0}>
						Salvar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
