/**
 * Pagina - /dashboard/configurations/security
 *
 * Visao geral:
 * - Componente de pagina para a rota `/dashboard/configurations/security`, organizado no App Router.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Orquestrar a composicao visual da rota.
 * - Disparar carregamentos de dados quando necessario.
 * - Renderizar estados de sucesso e erro.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/configurations/security/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
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
import { toast } from 'sonner'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const SecurityPage = () => {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const handleSubmit = async (event: React.FormEvent) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		event.preventDefault()
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
								<Input
									id='currentPassword'
									type='password'
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									required
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='newPassword'>Nova senha</Label>
								<Input
									id='newPassword'
									type='password'
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									required
								/>
								<p className='text-xs text-muted-foreground'>
									Mínimo 8 caracteres, com letras e números.
								</p>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirmar nova senha</Label>
								<Input
									id='confirmPassword'
									type='password'
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
								/>
							</div>
							<Button type='submit' disabled={isLoading}>
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
