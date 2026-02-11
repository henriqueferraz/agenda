/**
 * Bloco de usuário no rodapé do sidebar. Exibe avatar, nome e email (da sessão
 * ou das props), dropdown com opções (Account, Billing, Notifications) e Sair
 * (chama /api/auth/logout e redireciona para /login).
 *
 * @example
 * <NavUser user={{ name: 'João', email: 'joao@exemplo.com', avatar: '/avatar.jpg' }} />
 */
'use client'
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Sparkles,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
/**
 * Props do componente NavUser.
 */
interface NavUserProps {
	/** Dados do usuário (fallback quando não há sessão) */
	user: {
		/** Nome exibido */
		name: string
		/** Email exibido */
		email: string
		/** URL do avatar */
		avatar: string
	}
}
/**
 * Item de menu do sidebar que exibe usuário (avatar, nome, email) e dropdown com Sair.
 *
 * @param props - user
 * @returns JSX.Element
 */
export const NavUser = ({ user }: NavUserProps) => {
	const { isMobile } = useSidebar()
	const router = useRouter()
	const { user: sessionUser } = useAuth()
	const displayName = sessionUser?.name || user.name
	const displayEmail = sessionUser?.email || user.email
	const displayAvatar = sessionUser?.image || user.avatar
	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		router.push('/login')
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
							<Avatar className='h-8 w-8 rounded-lg'>
								<AvatarImage src={displayAvatar} alt={displayName} />
								<AvatarFallback className='rounded-lg'>CN</AvatarFallback>
							</Avatar>
							<div className='grid flex-1 text-left text-sm leading-tight'>
								<span className='truncate font-medium'>{displayName}</span>
								<span className='truncate text-xs'>{displayEmail}</span>
							</div>
							<ChevronsUpDown className='ml-auto size-4' />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
						side={isMobile ? 'bottom' : 'right'}
						align='end'
						sideOffset={4}
					>
						<DropdownMenuLabel className='p-0 font-normal'>
							<div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
								<Avatar className='h-8 w-8 rounded-lg'>
									<AvatarImage src={displayAvatar} alt={displayName} />
									<AvatarFallback className='rounded-lg'>CN</AvatarFallback>
								</Avatar>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-medium'>{displayName}</span>
									<span className='truncate text-xs'>{displayEmail}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<Sparkles />
								Upgrade to Pro
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<BadgeCheck />
								Account
							</DropdownMenuItem>
							<DropdownMenuItem>
								<CreditCard />
								Billing
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Bell />
								Notifications
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							<LogOut />
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
