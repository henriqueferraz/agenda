/**
 * Pagina - /register
 *
 * Visao geral:
 * - Componente de pagina para a rota `/register`, organizado no App Router.
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
 * import * as modulo from "@/app/(public)/register/page";
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
import { toast } from 'sonner'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
type Step = 'register' | 'verify'
export const RegisterPage = () => {
	const router = useRouter()
	const [step, setStep] = useState<Step>('register')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [otp, setOtp] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const handleRegister = async (event: React.FormEvent) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		event.preventDefault()
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password }),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Erro ao criar conta.')
				return
			}
			toast.success(data.message || 'Conta criada. Verifique seu email.')
			setStep('verify')
		} catch (error) {
			console.error('Erro ao registrar:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	const handleVerify = async (event: React.FormEvent) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		event.preventDefault()
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code: otp }),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Código inválido.')
				return
			}
			toast.success('Email verificado! Faça login.')
			router.push('/login')
		} catch (error) {
			console.error('Erro ao verificar OTP:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	const handleResend = async () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/resend-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Erro ao reenviar.')
				return
			}
			toast.success(data.message || 'Código reenviado.')
		} catch (error) {
			console.error('Erro ao reenviar OTP:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className='min-h-screen flex items-center justify-center bg-muted px-4'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle>
						{step === 'register' ? 'Criar conta' : 'Verificar email'}
					</CardTitle>
					<CardDescription>
						{step === 'register'
							? 'Informe seus dados para criar a conta.'
							: 'Digite o código enviado para seu email.'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === 'register' ? (
						<form onSubmit={handleRegister} className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='name'>Nome</Label>
								<Input
									id='name'
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
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
								<Input
									id='password'
									type='password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
								<p className='text-xs text-muted-foreground'>
									Mínimo 8 caracteres, com letras e números.
								</p>
							</div>
							<Button type='submit' className='w-full' disabled={isLoading}>
								{isLoading ? 'Criando...' : 'Criar conta'}
							</Button>
						</form>
					) : (
						<form onSubmit={handleVerify} className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='otp'>Código OTP</Label>
								<Input
									id='otp'
									value={otp}
									onChange={(e) => setOtp(e.target.value)}
									required
									maxLength={6}
								/>
							</div>
							<Button type='submit' className='w-full' disabled={isLoading}>
								{isLoading ? 'Verificando...' : 'Verificar'}
							</Button>
							<Button
								type='button'
								variant='outline'
								className='w-full'
								onClick={handleResend}
								disabled={isLoading}
							>
								Reenviar código
							</Button>
						</form>
					)}
					<div className='mt-4 text-sm text-muted-foreground'>
						Já possui conta?{' '}
						<Link href='/login' className='underline'>
							Entrar
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default RegisterPage
