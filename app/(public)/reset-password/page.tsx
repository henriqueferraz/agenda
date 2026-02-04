/**
 * Pagina - /reset-password
 *
 * Visao geral:
 * - Componente de pagina para a rota `/reset-password`, organizado no App Router.
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
 * import * as modulo from "@/app/(public)/reset-password/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { validatePasswordPolicy } from '@/lib/password-policy'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const ResetPasswordForm = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const token = searchParams.get('token') || ''
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [isPasswordVisible, setIsPasswordVisible] = useState(false)
	const [isConfirmVisible, setIsConfirmVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const handleTogglePasswordVisibility = () => {
		setIsPasswordVisible((prev) => !prev)
	}
	const handleToggleConfirmVisibility = () => {
		setIsConfirmVisible((prev) => !prev)
	}
	const handleSubmit = async (event: React.FormEvent) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		event.preventDefault()
		const passwordValidation = validatePasswordPolicy(password)
		if (!passwordValidation.valid) {
			toast.error(passwordValidation.message)
			return
		}
		if (password !== confirm) {
			toast.error('As senhas não conferem.')
			return
		}
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password }),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Erro ao redefinir.')
				return
			}
			toast.success('Senha redefinida com sucesso.')
			router.push('/login')
		} catch (error) {
			console.error('Erro ao redefinir senha:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className='min-h-screen flex items-center justify-center bg-muted px-4'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle>Redefinir senha</CardTitle>
					<CardDescription>Informe sua nova senha.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='password'>Nova senha</Label>
							<div className='relative'>
								<Input
									id='password'
									type={isPasswordVisible ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									className='pr-10'
								/>
								<button
									type='button'
									onClick={handleTogglePasswordVisibility}
									aria-label={
										isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'
									}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
								>
									{isPasswordVisible ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
							<p className='text-xs text-muted-foreground'>
								Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere
								especial.
							</p>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='confirm'>Confirmar senha</Label>
							<div className='relative'>
								<Input
									id='confirm'
									type={isConfirmVisible ? 'text' : 'password'}
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
									required
									className='pr-10'
								/>
								<button
									type='button'
									onClick={handleToggleConfirmVisibility}
									aria-label={
										isConfirmVisible ? 'Ocultar senha' : 'Mostrar senha'
									}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
								>
									{isConfirmVisible ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
						</div>
						<Button
							type='submit'
							className='w-full'
							disabled={isLoading || !token}
						>
							{isLoading ? 'Salvando...' : 'Salvar nova senha'}
						</Button>
					</form>
					<div className='mt-4 text-sm text-muted-foreground'>
						Voltar para{' '}
						<Link href='/login' className='underline'>
							login
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export const ResetPasswordPage = () => {
	return (
		<Suspense
			fallback={
				<div className='min-h-screen flex items-center justify-center bg-muted px-4'>
					<Card className='w-full max-w-md'>
						<CardHeader>
							<CardTitle>Redefinir senha</CardTitle>
							<CardDescription>Carregando informações...</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-sm text-muted-foreground'>
								Aguarde enquanto preparamos o formulário.
							</div>
						</CardContent>
					</Card>
				</div>
			}
		>
			<ResetPasswordForm />
		</Suspense>
	)
}

export default ResetPasswordPage
