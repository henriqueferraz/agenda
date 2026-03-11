/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-03-11
 * @version 2026.03.11
 * @projectVersion 0.9.0
 */
/**
 * Menu principal do sidebar. Renderiza grupos colapsáveis por item (Dashboard,
 * Configurações, Serviços, Agendamentos), cada um com ícone, título e subitens
 * com links. O item marcado isActive fica aberto por padrão.
 * Itens sem subitens são renderizados como links diretos.
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
 * Se um item não tiver subitens (items vazio ou undefined), renderiza como link direto.
 *
 * @param props - items
 * @returns JSX.Element
 */
export const NavMain = ({ items }: NavMainProps) => {
	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => {
					// Se não houver subitens, renderiza como link direto
					if (!item.items || item.items.length === 0) {
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton asChild tooltip={item.title}>
									<a href={item.url}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
									</a>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					}

					// Se houver subitens, renderiza como grupo colapsável
					return (
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
										{item.items.map((subItem) => (
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
					)
				})}
			</SidebarMenu>
		</SidebarGroup>
	)
}
