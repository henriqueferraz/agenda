/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Página de login (rota `/login`).
 * Client Component com formulário de email/senha, toggle de visibilidade de senha e
 * link para esqueci senha e registro; autentica via /api/auth/login e redireciona para /dashboard.
 */
'use client'
import { useState } from 'react'
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
/**
 * Página de login: formulário de autenticação e links para recuperação de senha e registro.
 * @returns JSX.Element
 */
export const LoginPage = () => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isPasswordVisible, setIsPasswordVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const handleTogglePasswordVisibility = () => {
		setIsPasswordVisible((prev) => !prev)
	}
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Falha ao autenticar.')
				return
			}
			toast.success('Login realizado com sucesso.')
			window.location.href = '/dashboard'
		} catch (error) {
			console.error('Erro ao fazer login:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className='min-h-screen flex items-center justify-center bg-muted px-4'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle>Entrar</CardTitle>
					<CardDescription>
						Use seu email e senha para acessar o painel.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='password'>Senha</Label>
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
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center'
								>
									{isPasswordVisible ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
						</div>
						<Button type='submit' className='w-full min-h-[44px]' disabled={isLoading}>
							{isLoading ? 'Entrando...' : 'Entrar'}
						</Button>
					</form>
					<div className='mt-4 text-sm text-muted-foreground'>
						<Link href='/forgot-password' className='underline'>
							Esqueci minha senha
						</Link>
					</div>
					<div className='mt-2 text-sm text-muted-foreground'>
						Não possui conta?{' '}
						<Link href='/register' className='underline'>
							Criar conta
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default LoginPage
