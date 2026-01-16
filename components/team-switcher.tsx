/**
 * Componente - Team Switcher
 *
 * Visao geral:
 * - Componente React reutilizavel para Team Switcher.
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
 * import * as modulo from "@/components/team-switcher";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import * as React from 'react'
import {
	DropdownMenu,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface Team {
	name: string
	logo: React.ElementType
	plan: string
}
interface TeamSwitcherProps {
	teams: Team[]
}
export const TeamSwitcher = ({ teams }: TeamSwitcherProps) => {
	// Passo 1: selecionar o time ativo inicial.
	// Passo 2: validar se ha time disponivel para exibir.
	// Passo 3: renderizar o botao com dados do time.
	// Passo 4: retornar a estrutura do menu.
	const [activeTeam] = React.useState(teams[0])
	if (!activeTeam) {
		return null
	}
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size='lg'
							className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
						>
							<div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
								<activeTeam.logo className='size-4' />
							</div>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-medium'>{activeTeam.name}</span>
								<span className='truncate text-xs'>{activeTeam.plan}</span>
							</div>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
