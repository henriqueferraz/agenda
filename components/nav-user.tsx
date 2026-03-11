/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-03-11
 * @version 2026.03.11
 * @projectVersion 0.9.0
 */
/**
 * Bloco de usuário no rodapé do sidebar. Exibe logo da empresa, nome e email (da sessão
 * ou das props), dropdown com opções (Account, Billing, Notifications) e Sair
 * (chama /api/auth/logout e redireciona para /login).
 *
 * @example
 * <NavUser user={{ name: 'João', email: 'joao@exemplo.com', avatar: '/avatar.jpg' }} logoUrl='/uploads/logos/logo.png' />
 */
'use client'
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogOut,
	Sparkles,
	User,
} from 'lucide-react'
import Image from 'next/image'
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
	/** URL do logo da empresa (local, remota ou data URL). */
	logoUrl?: string | null
}
/**
 * Item de menu do sidebar que exibe usuário (logo da empresa, nome, email) e dropdown com Sair.
 *
 * @param props - user, logoUrl
 * @returns JSX.Element
 */
export const NavUser = ({ user, logoUrl }: NavUserProps) => {
	const { isMobile } = useSidebar()
	const router = useRouter()
	const { user: sessionUser } = useAuth()
	const displayName = sessionUser?.name || user.name
	const displayEmail = sessionUser?.email || user.email
	const displayLogoUrl = logoUrl || sessionUser?.image || user.avatar
	const shouldDisableOptimization =
		typeof displayLogoUrl === 'string' &&
		displayLogoUrl.length > 0 &&
		!displayLogoUrl.startsWith('/')

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
							<div className='flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground'>
								{displayLogoUrl ? (
									<Image
										src={displayLogoUrl}
										alt='Logo da empresa'
										width={32}
										height={32}
										className='size-8 object-cover'
										unoptimized={shouldDisableOptimization}
									/>
								) : (
									<User className='size-4' />
								)}
							</div>
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
								<div className='flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground shrink-0'>
									{displayLogoUrl ? (
										<Image
											src={displayLogoUrl}
											alt='Logo da empresa'
											width={32}
											height={32}
											className='size-8 object-cover'
											unoptimized={shouldDisableOptimization}
										/>
									) : (
										<User className='size-4' />
									)}
								</div>
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
								Assinatura Profissional
							</DropdownMenuItem>
						</DropdownMenuGroup>
						{/* <DropdownMenuSeparator />
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
						<DropdownMenuSeparator /> */}
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
