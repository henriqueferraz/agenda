/**
 * Componente - App Sidebar
 *
 * Visao geral:
 * - Componente React reutilizavel para App Sidebar.
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
 * import * as modulo from "@/components/app-sidebar";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
'use client'
import * as React from 'react'
import {
	CalendarDays,
	GalleryVerticalEnd,
	House,
	Settings2,
	SquareTerminal,
	type LucideIcon,
} from 'lucide-react'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from '@/components/ui/sidebar'
interface AppSidebarData {
	user: {
		name: string
		email: string
		avatar: string
	}
	teams: {
		name: string
		logo: React.ElementType
		plan: string
	}[]
	navMain: {
		title: string
		url: string
		icon?: LucideIcon
		isActive?: boolean
		items: {
			title: string
			url: string
		}[]
	}[]
}
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	data?: AppSidebarData
}
// Dados de exemplo para visualizacao local
const defaultData: AppSidebarData = {
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg',
	},
	teams: [
		{
			name: 'Acme Inc',
			logo: GalleryVerticalEnd,
			plan: 'Enterprise',
		},
	],
	navMain: [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: House,
			isActive: true,
			items: [
				{
					title: 'Principal',
					url: '/dashboard',
				},
			],
		},
		{
			title: 'Configurações',
			url: '#',
			icon: Settings2,
			isActive: false,
			items: [
				{
					title: 'Atividade',
					url: '/dashboard/configurations/activity',
				},
				{
					title: 'Modelo',
					url: '/dashboard/configurations/model',
				},
				{
					title: 'Endereço',
					url: '/dashboard/configurations/address',
				},
				{
					title: 'Horários',
					url: '/dashboard/configurations/time',
				},
				{
					title: 'Segurança',
					url: '/dashboard/configurations/security',
				},
			],
		},
		{
			title: 'Serviços',
			url: '#',
			icon: SquareTerminal,
			isActive: false,
			items: [
				{
					title: 'Funcionários',
					url: '/dashboard/services/employee',
				},
				{
					title: 'Serviços',
					url: '/dashboard/services/service',
				},
			],
		},
		{
			title: 'Agendamentos',
			url: '#',
			icon: CalendarDays,
			isActive: false,
			items: [
				{
					title: 'Agenda',
					url: '/dashboard/schedule/calendar',
				},
				{
					title: 'Feriados',
					url: '/dashboard/schedule/stopday',
				},
			],
		}
	],
}
export const AppSidebar = ({
	data = defaultData,
	...props
}: AppSidebarProps): React.ReactNode => {
	// Passo 1: compor estrutura base do sidebar.
	// Passo 2: injetar dados de usuario e navegacao.
	// Passo 3: renderizar conteudo e footer do menu.
	// Passo 4: retornar layout completo do sidebar.
	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
