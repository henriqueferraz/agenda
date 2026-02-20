/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Página de alteração de senha (rota `/dashboard/configurations/security`).
 * Client Component com formulário de senha atual, nova senha e confirmação; valida
 * política de senha e chama API /api/auth/change-password; redireciona para login após sucesso.
 */
'use client'
import { useState } from 'react'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { validatePasswordPolicy } from '@/lib/password-policy'
/**
 * Página de segurança: formulário para alterar senha do usuário autenticado.
 * @returns JSX.Element
 */
export const SecurityPage = () => {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false)
	const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false)
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
		useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const handleToggleCurrentPasswordVisibility = () => {
		setIsCurrentPasswordVisible((prev) => !prev)
	}
	const handleToggleNewPasswordVisibility = () => {
		setIsNewPasswordVisible((prev) => !prev)
	}
	const handleToggleConfirmPasswordVisibility = () => {
		setIsConfirmPasswordVisible((prev) => !prev)
	}
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		const passwordValidation = validatePasswordPolicy(newPassword)
		if (!passwordValidation.valid) {
			toast.error(passwordValidation.message)
			return
		}
		if (newPassword !== confirmPassword) {
			toast.error('As senhas não conferem.')
			return
		}
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Erro ao atualizar senha.')
				return
			}
			toast.success('Senha atualizada. Faça login novamente.')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			window.location.href = '/login'
		} catch (error) {
			console.error('Erro ao alterar senha:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<SidebarInset>
			<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
				<div className='flex items-center gap-2 px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator
						orientation='vertical'
						className='mr-2 data-[orientation=vertical]:h-4'
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href='/dashboard/configurations/security'>
									Configurações
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Segurança</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className='space-y-6 p-4 sm:p-6 md:p-8'>
				<Card>
					<CardHeader>
						<CardTitle>Alterar senha</CardTitle>
						<CardDescription>
							Atualize sua senha de acesso com segurança.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className='space-y-4 max-w-lg'>
							<div className='space-y-2'>
								<Label htmlFor='currentPassword'>Senha atual</Label>
								<div className='relative'>
									<Input
										id='currentPassword'
										type={isCurrentPasswordVisible ? 'text' : 'password'}
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										required
										className='pr-10'
									/>
									<button
										type='button'
										onClick={handleToggleCurrentPasswordVisibility}
										aria-label={
											isCurrentPasswordVisible
												? 'Ocultar senha'
												: 'Mostrar senha'
										}
										className='absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors'
									>
										{isCurrentPasswordVisible ? (
											<EyeOff className='h-4 w-4' />
										) : (
											<Eye className='h-4 w-4' />
										)}
									</button>
								</div>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='newPassword'>Nova senha</Label>
								<div className='relative'>
									<Input
										id='newPassword'
										type={isNewPasswordVisible ? 'text' : 'password'}
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										required
										className='pr-10'
									/>
									<button
										type='button'
										onClick={handleToggleNewPasswordVisibility}
										aria-label={
											isNewPasswordVisible
												? 'Ocultar senha'
												: 'Mostrar senha'
										}
										className='absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors'
									>
										{isNewPasswordVisible ? (
											<EyeOff className='h-4 w-4' />
										) : (
											<Eye className='h-4 w-4' />
										)}
									</button>
								</div>
								<p className='text-xs text-muted-foreground'>
									Mínimo 8 caracteres, com maiúscula, minúscula, número e
									caractere especial.
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirmar nova senha</Label>
								<div className='relative'>
									<Input
										id='confirmPassword'
										type={isConfirmPasswordVisible ? 'text' : 'password'}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										className='pr-10'
									/>
									<button
										type='button'
										onClick={handleToggleConfirmPasswordVisibility}
										aria-label={
											isConfirmPasswordVisible
												? 'Ocultar senha'
												: 'Mostrar senha'
										}
										className='absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors'
									>
										{isConfirmPasswordVisible ? (
											<EyeOff className='h-4 w-4' />
										) : (
											<Eye className='h-4 w-4' />
										)}
									</button>
								</div>
							</div>
							<Button type='submit' disabled={isLoading} className='min-h-[44px]'>
								{isLoading ? 'Salvando...' : 'Atualizar senha'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</SidebarInset>
	)
}

export default SecurityPage
