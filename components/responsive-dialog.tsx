/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Componente wrapper de Dialog responsivo com tamanhos pré-configurados e
 * acessibilidade automática (aria-describedby, aria-labelledby).
 * Garante responsividade em todos os tamanhos de tela com breakpoints mobile-first.
 *
 * @example
 * import { ResponsiveDialog, ResponsiveDialogContent } from '@/components/responsive-dialog'
 *
 * <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
 *   <ResponsiveDialogContent size="md" title="Título do Modal" description="Descrição">
 *     <p>Conteúdo do modal</p>
 *   </ResponsiveDialogContent>
 * </ResponsiveDialog>
 */
'use client'

import * as React from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Tamanhos disponíveis para o modal responsivo */
type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Mapeamento de tamanhos para classes CSS responsivas.
 * Todos incluem w-full max-w-[calc(100vw-2rem)] como base mobile.
 */
const SIZE_CLASSES: Record<DialogSize, string> = {
	/** Pequeno: 384px em telas sm+ */
	sm: 'w-full max-w-[calc(100vw-2rem)] sm:max-w-sm',
	/** Médio: 512px em telas sm+ (padrão) */
	md: 'w-full max-w-[calc(100vw-2rem)] sm:max-w-md',
	/** Grande: 672px em telas sm+, 768px em md+ */
	lg: 'w-full max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl',
	/** Extra grande: 768px em sm+, 896px em md+, 1024px em lg+ */
	xl: 'w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
}

/** Props do componente ResponsiveDialog (wrapper do Dialog raiz) */
interface ResponsiveDialogProps {
	/** Se o modal está aberto */
	open?: boolean
	/** Callback de mudança de estado open/closed */
	onOpenChange?: (open: boolean) => void
	/** Conteúdo do modal (deve incluir ResponsiveDialogContent) */
	children: React.ReactNode
}

/**
 * Wrapper do Dialog raiz com suporte a estado controlado.
 *
 * @param props - Props do Dialog (open, onOpenChange, children)
 * @returns JSX.Element com Dialog raiz
 *
 * @example
 * <ResponsiveDialog open={open} onOpenChange={setOpen}>
 *   <ResponsiveDialogContent size="md" title="Título">
 *     <p>Conteúdo</p>
 *   </ResponsiveDialogContent>
 * </ResponsiveDialog>
 */
export const ResponsiveDialog = ({
	open,
	onOpenChange,
	children,
}: ResponsiveDialogProps): React.JSX.Element => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{children}
		</Dialog>
	)
}

/** Props do componente ResponsiveDialogContent */
interface ResponsiveDialogContentProps {
	/** Tamanho do modal: 'sm' | 'md' | 'lg' | 'xl'. Padrão: 'md' */
	size?: DialogSize
	/** Título do modal (usado como aria-labelledby automaticamente) */
	title: string
	/** Descrição do modal (usada como aria-describedby automaticamente). Opcional. */
	description?: string
	/** Se deve ocultar visualmente o título (mantém para screen readers). Padrão: false */
	hideTitle?: boolean
	/** Se deve ocultar visualmente a descrição (mantém para screen readers). Padrão: false */
	hideDescription?: boolean
	/** Classes CSS adicionais para o DialogContent */
	className?: string
	/** Conteúdo do modal */
	children: React.ReactNode
	/** Se deve mostrar o botão de fechar. Padrão: true */
	showCloseButton?: boolean
}

/**
 * Conteúdo do modal responsivo com tamanhos pré-configurados e acessibilidade automática.
 * Inclui DialogHeader com título e descrição (opcionalmente ocultos visualmente),
 * garantindo que aria-labelledby e aria-describedby estejam sempre presentes.
 *
 * @param props - Props do conteúdo do modal
 * @returns JSX.Element com DialogContent responsivo
 *
 * @example
 * <ResponsiveDialogContent size="lg" title="Editar Serviço" description="Altere os dados do serviço">
 *   <form>...</form>
 * </ResponsiveDialogContent>
 */
export const ResponsiveDialogContent = ({
	size = 'md',
	title,
	description,
	hideTitle = false,
	hideDescription = false,
	className,
	children,
	showCloseButton = true,
}: ResponsiveDialogContentProps): React.JSX.Element => {
	return (
		<DialogContent
			className={cn(SIZE_CLASSES[size], 'p-4 sm:p-6', className)}
			showCloseButton={showCloseButton}
		>
			<DialogHeader>
				<DialogTitle className={hideTitle ? 'sr-only' : undefined}>
					{title}
				</DialogTitle>
				{description && (
					<DialogDescription className={hideDescription ? 'sr-only' : undefined}>
						{description}
					</DialogDescription>
				)}
			</DialogHeader>
			{children}
		</DialogContent>
	)
}
