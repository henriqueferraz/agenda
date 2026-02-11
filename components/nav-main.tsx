/**
 * Menu principal do sidebar. Renderiza grupos colapsáveis por item (Dashboard,
 * Configurações, Serviços, Agendamentos), cada um com ícone, título e subitens
 * com links. O item marcado isActive fica aberto por padrão.
 *
 * @example
 * <NavMain items={data.navMain} />
 */
'use client'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'
/**
 * Item do menu principal (grupo colapsável).
 */
interface NavMainItem {
	/** Título do grupo */
	title: string
	/** URL do grupo (geralmente # para apenas expandir) */
	url: string
	/** Ícone opcional (Lucide) */
	icon?: LucideIcon
	/** Se true, grupo inicia aberto */
	isActive?: boolean
	/** Subitens com título e URL */
	items?: {
		title: string
		url: string
	}[]
}
/**
 * Props do componente NavMain.
 */
interface NavMainProps {
	/** Lista de grupos do menu (Dashboard, Configurações, etc.) */
	items: NavMainItem[]
}
/**
 * Menu de navegação principal do sidebar com grupos colapsáveis e sublinks.
 *
 * @param props - items
 * @returns JSX.Element
 */
export const NavMain = ({ items }: NavMainProps) => {
	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						asChild
						defaultOpen={item.isActive}
						className='group/collapsible'
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
									<ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.items?.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild>
												<a href={subItem.url}>
													<span>{subItem.title}</span>
												</a>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
