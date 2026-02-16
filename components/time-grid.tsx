/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Componente reutilizável de grid de seleção de horários.
 * Extrai o padrão repetido em 4+ componentes (horario.tsx, appointment-modal.tsx,
 * public-appointment-modal.tsx, modal-employee-times.tsx) em um único componente
 * com responsividade mobile-first, touch targets mínimos de 44px e aria-labels automáticos.
 *
 * @example
 * import { TimeGrid } from '@/components/time-grid'
 *
 * <TimeGrid
 *   times={['08:00', '09:00', '10:00']}
 *   selected={['09:00']}
 *   onSelect={(time) => handleTimeSelect(time)}
 * />
 */
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Modo de seleção: 'single' permite apenas um, 'multiple' permite vários */
type SelectionMode = 'single' | 'multiple'

/** Props do componente TimeGrid */
interface TimeGridProps {
	/** Lista de horários disponíveis (formato HH:mm) */
	times: string[]
	/** Horário(s) selecionado(s). String para single, array para multiple. */
	selected: string | string[]
	/** Callback ao clicar em um horário */
	onSelect: (time: string) => void
	/** Horários desabilitados (não clicáveis) */
	disabled?: string[]
	/** Modo de seleção: 'single' ou 'multiple'. Padrão: 'single' */
	mode?: SelectionMode
	/** Altura máxima do container com scroll. Padrão: 'max-h-48' */
	maxHeight?: string
	/** Classes CSS adicionais para o container do grid */
	className?: string
	/** Texto descritivo para acessibilidade (aria-label do container) */
	ariaLabel?: string
}

/**
 * Grid responsivo de seleção de horários com acessibilidade.
 * Layout: 2 colunas mobile → 3 colunas sm → 4 colunas md.
 * Cada botão tem min-h-[44px] para touch targets adequados e aria-label automático.
 *
 * @param props - Props do TimeGrid
 * @returns JSX.Element com grid de botões de horários
 *
 * @example
 * // Seleção única (appointment modal)
 * <TimeGrid
 *   times={['08:00', '09:00', '10:00', '11:00']}
 *   selected="09:00"
 *   onSelect={(time) => setSelectedTime(time)}
 * />
 *
 * @example
 * // Seleção múltipla (configuração de horários)
 * <TimeGrid
 *   times={['08:00', '09:00', '10:00', '11:00']}
 *   selected={['09:00', '10:00']}
 *   onSelect={(time) => toggleTime(time)}
 *   mode="multiple"
 * />
 */
export const TimeGrid = ({
	times,
	selected,
	onSelect,
	disabled = [],
	mode = 'single',
	maxHeight = 'max-h-48',
	className,
	ariaLabel = 'Grade de horários disponíveis',
}: TimeGridProps): React.JSX.Element => {
	/** Verifica se um horário está selecionado */
	const isSelected = (time: string): boolean => {
		if (Array.isArray(selected)) return selected.includes(time)
		return selected === time
	}

	/** Verifica se um horário está desabilitado */
	const isDisabled = (time: string): boolean => {
		return disabled.includes(time)
	}

	return (
		<div
			className={cn(
				'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2',
				maxHeight,
				'overflow-y-auto',
				className,
			)}
			role='listbox'
			aria-label={ariaLabel}
			aria-multiselectable={mode === 'multiple'}
		>
			{times.map((time) => {
				const timeSelected = isSelected(time)
				const timeDisabled = isDisabled(time)

				return (
					<Button
						key={time}
						type='button'
						variant={timeSelected ? 'default' : 'outline'}
						size='sm'
						className={cn(
							'min-h-[44px] min-w-[44px] text-xs w-full',
							timeSelected && 'bg-blue-600 text-white hover:bg-blue-700',
							!timeSelected &&
								!timeDisabled &&
								'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
							timeDisabled && 'opacity-50 cursor-not-allowed',
						)}
						disabled={timeDisabled}
						onClick={() => onSelect(time)}
						aria-label={`${timeSelected ? 'Desselecionar' : 'Selecionar'} horário ${time}`}
						aria-selected={timeSelected}
						role='option'
					>
						{time}
					</Button>
				)
			})}
		</div>
	)
}
