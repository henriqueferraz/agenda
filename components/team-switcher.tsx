/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Componente TeamSwitcher - Exibe o logo e nome fantasia da empresa no header do sidebar.
 *
 * Quando o usuario faz upload de um logo, exibe a imagem no quadrado 32x32.
 * Caso contrario, exibe o icone padrao. O nome fantasia tem truncamento automatico
 * para nomes longos, garantindo responsividade expandido ou colapsado em icone.
 *
 * @example
 * <TeamSwitcher teams={[{ name: 'Barbearia', logo: Building2, plan: '' }]} logoUrl='/uploads/logos/logo.png' />
 */
'use client'
import * as React from 'react'
import Image from 'next/image'
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
	/** Componente de icone para o logo (fallback quando nao ha imagem) */
	logo: React.ElementType
	/** Nome do plano (ex: 'Premium', 'Free') */
	plan: string
}

/** Props do componente TeamSwitcher */
interface TeamSwitcherProps {
	/** Lista de times disponiveis */
	teams: Team[]
	/** URL do logo da empresa (local, remota ou data URL). */
	logoUrl?: string | null
}

/**
 * Header do sidebar com logo e nome fantasia da empresa.
 * @param props - Props com lista de teams e URL do logo
 * @returns JSX.Element
 */
export const TeamSwitcher = ({ teams, logoUrl }: TeamSwitcherProps) => {
	const [activeTeam] = React.useState(teams[0])
	const shouldDisableOptimization =
		typeof logoUrl === 'string' && logoUrl.length > 0 && !logoUrl.startsWith('/')
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
							<div className='flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground'>
								{logoUrl ? (
									<Image
										src={logoUrl}
										alt='Logo da empresa'
										width={32}
										height={32}
										className='size-8 object-cover'
										unoptimized={shouldDisableOptimization}
									/>
								) : (
									<activeTeam.logo className='size-4' />
								)}
							</div>
							<span className='flex-1 min-w-0 truncate text-sm font-medium'>{activeTeam.name}</span>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
