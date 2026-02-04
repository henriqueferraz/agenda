/**
 * Pagina - /login
 *
 * Visao geral:
 * - Componente de pagina para a rota `/login`, organizado no App Router.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Orquestrar a composicao visual da rota.
 * - Autenticar o usuário e exibir feedback de sucesso/erro.
 * - Permitir alternar visibilidade da senha.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(public)/login/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const LoginPage = () => {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isPasswordVisible, setIsPasswordVisible] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const handleTogglePasswordVisibility = () => {
		setIsPasswordVisible((prev) => !prev)
	}
	const handleSubmit = async (event: React.FormEvent) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
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
			router.push('/dashboard')
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
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
								>
									{isPasswordVisible ? (
										<EyeOff className='h-4 w-4' />
									) : (
										<Eye className='h-4 w-4' />
									)}
								</button>
							</div>
						</div>
						<Button type='submit' className='w-full' disabled={isLoading}>
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
