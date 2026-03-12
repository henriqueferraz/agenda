/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Página de registro de usuário (rota `/register`).
 * Client Component com formulário de nome/email/CPF/senha e etapa de verificação OTP por email;
 * valida política de senha e CPF, chama /api/auth/register e /api/auth/verify-otp e redireciona para login.
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
import { validatePasswordPolicy } from '@/lib/password-policy'
import { formatCPF, isCPFValid } from '@/utils/formatCPF'
import posthog from 'posthog-js'
type Step = 'register' | 'verify'
interface ApiResponsePayload {
	error?: string
	message?: string
}
/**
 * Extrai o payload da resposta e evita falhas de parse JSON.
 * @param response - resposta do fetch
 * @returns payload tipado e texto fallback
 */
const parseResponseBody = async (
	response: Response,
): Promise<{ payload: ApiResponsePayload | null; fallbackText: string | null }> => {
	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		const payload = (await response.json()) as ApiResponsePayload
		return { payload, fallbackText: null }
	}
	const fallbackText = await response.text()
	return { payload: null, fallbackText }
}
/**
 * Recupera mensagens do payload com segurança.
 * @param payload - payload da API
 * @param key - chave da mensagem
 * @returns mensagem ou null
 */
const getPayloadMessage = (
	payload: ApiResponsePayload | null,
	key: 'error' | 'message',
): string | null => {
	const value = payload?.[key]
	return typeof value === 'string' ? value : null
}
/**
 * Página de registro: formulário de criação de conta e verificação OTP por email.
 * @returns JSX.Element
 */
export const RegisterPage = () => {
	const router = useRouter()
	const [step, setStep] = useState<Step>('register')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [cpf, setCpf] = useState('')
	const [cpfError, setCpfError] = useState('')
	const [password, setPassword] = useState('')
	const [isPasswordVisible, setIsPasswordVisible] = useState(false)
	const [otp, setOtp] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const result = formatCPF(e.target.value)
		setCpf(result.formatted)
		if (e.target.value.replace(/\D/g, '').length === 11) {
			setCpfError(result.isValid ? '' : 'CPF inválido')
		} else {
			setCpfError('')
		}
	}
	const handleTogglePasswordVisibility = (): void => {
		setIsPasswordVisible((prev) => !prev)
	}
	const handleRegister = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault()
		if (!isCPFValid(cpf)) {
			toast.error('CPF inválido.')
			return
		}
		const passwordValidation = validatePasswordPolicy(password)
		if (!passwordValidation.valid) {
			toast.error(passwordValidation.message)
			return
		}
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, cpf, password }),
			})
			const { payload, fallbackText } = await parseResponseBody(response)
			if (!response.ok) {
				const apiError =
					getPayloadMessage(payload, 'error') ||
					fallbackText ||
					'Erro ao criar conta.'
				toast.error(apiError)
				return
			}
			const apiMessage =
				getPayloadMessage(payload, 'message') ||
				'Conta criada. Verifique seu email.'
			toast.success(apiMessage)
			setStep('verify')
		} catch (error) {
			console.error('Erro ao registrar:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	const handleVerify = async (
		event: React.FormEvent<HTMLFormElement>,
	): Promise<void> => {
		event.preventDefault()
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, code: otp }),
			})
			const { payload, fallbackText } = await parseResponseBody(response)
			if (!response.ok) {
				const apiError =
					getPayloadMessage(payload, 'error') ||
					fallbackText ||
					'Código inválido.'
				toast.error(apiError)
				return
			}
			posthog.identify(email)
			posthog.capture('user_signed_up')
			toast.success('Email verificado! Faça login.')
			router.push('/login')
		} catch (error) {
			console.error('Erro ao verificar OTP:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	const handleResend = async (): Promise<void> => {
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/resend-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			const { payload, fallbackText } = await parseResponseBody(response)
			if (!response.ok) {
				const apiError =
					getPayloadMessage(payload, 'error') ||
					fallbackText ||
					'Erro ao reenviar.'
				toast.error(apiError)
				return
			}
			const apiMessage =
				getPayloadMessage(payload, 'message') || 'Código reenviado.'
			toast.success(apiMessage)
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
								<Label htmlFor='cpf'>CPF</Label>
								<Input
									id='cpf'
									value={cpf}
									onChange={handleCpfChange}
									placeholder='000.000.000-00'
									maxLength={14}
									required
									aria-label='CPF do usuário'
								/>
								{cpfError && (
									<p className='text-xs text-destructive'>{cpfError}</p>
								)}
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
								<p className='text-xs text-muted-foreground'>
									Mínimo 8 caracteres, com maiúscula, minúscula, número e
									caractere especial.
								</p>
							</div>
							<Button type='submit' className='w-full min-h-[44px]' disabled={isLoading}>
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
							<Button type='submit' className='w-full min-h-[44px]' disabled={isLoading}>
								{isLoading ? 'Verificando...' : 'Verificar'}
							</Button>
							<Button
								type='button'
								variant='outline'
								className='w-full min-h-[44px]'
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
