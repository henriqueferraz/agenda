/**
 * Componente TeamSwitcher - Seletor de time no sidebar
 *
 * Exibe o time/empresa ativo no topo do sidebar com logo, nome e plano.
 * Utiliza DropdownMenu do Radix e componentes do SidebarMenu.
 *
 * @example
 * <TeamSwitcher teams={[{ name: 'Empresa', logo: Building2, plan: 'Premium' }]} />
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
/** Dados de um time/empresa para o seletor */
interface Team {
	/** Nome do time/empresa */
	name: string
	/** Componente de icone para o logo */
	logo: React.ElementType
	/** Nome do plano (ex: 'Premium', 'Free') */
	plan: string
}

/** Props do componente TeamSwitcher */
interface TeamSwitcherProps {
	/** Lista de times disponiveis */
	teams: Team[]
}

/**
 * Seletor de time no sidebar. Exibe o time ativo com logo e plano.
 * @param props - Props com lista de teams
 * @returns JSX.Element
 */
export const TeamSwitcher = ({ teams }: TeamSwitcherProps) => {
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
