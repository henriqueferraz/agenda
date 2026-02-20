/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-17
 * @version 2026.02.17
 * @projectVersion 0.9.0
 */
/**
 * Sidebar principal do painel. Compõe header (TeamSwitcher), menu de navegação
 * (NavMain) e rodapé com usuário (NavUser). Aceita dados de usuário, times e
 * itens de menu; colapsável em ícone.
 *
 * @example
 * <AppSidebar data={sidebarData} />
 */
'use client'
import * as React from 'react'
import {
	CalendarDays,
	GalleryVerticalEnd,
	House,
	Settings2,
	Shield,
	SquareTerminal,
	Users,
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
/**
 * Estrutura de dados do sidebar: usuário, times e itens do menu principal.
 */
interface AppSidebarData {
	/** Dados do usuário logado (nome, email, avatar) */
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
/**
 * Props do AppSidebar. Estende as props do Sidebar (shadcn); data é opcional.
 */
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	/** Dados do usuário, times e navegação; se omitido, usa defaultData */
	data?: AppSidebarData
	/** Role do usuario autenticado; se master, exibe link de admin */
	userRole?: 'master' | 'enterprise'
}
/** Dados de exemplo para visualização local */
const defaultData: AppSidebarData = {
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/avatar.jpg',
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
			title: 'Clientes',
			url: '/dashboard/clients',
			icon: Users,
			isActive: false,
			items: [
				{
					title: 'Clientes',
					url: '/dashboard/clients',
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
					title: 'Mensagens',
					url: '/dashboard/services/message',
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
		},
	],
}

/** Item de navegacao exclusivo para usuarios master */
const adminNavItem = {
	title: 'Administração',
	url: '#',
	icon: Shield,
	isActive: false,
	items: [
		{
			title: 'Usuários',
			url: '/dashboard/admin/users',
		},
		{
			title: 'Clientes',
			url: '/dashboard/admin/clients',
		},
	],
}
/**
 * Sidebar do painel: header com time, menu principal e usuário no rodapé.
 *
 * @param props - data (opcional) e demais props do Sidebar
 * @returns React.ReactNode
 */
export const AppSidebar = ({
	data = defaultData,
	userRole,
	...props
}: AppSidebarProps): React.ReactNode => {
	const navItems = userRole === 'master'
		? [...data.navMain, adminNavItem]
		: data.navMain

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}
