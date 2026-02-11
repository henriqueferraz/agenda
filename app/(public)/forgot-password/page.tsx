/**
 * Página "Esqueci minha senha" (rota `/forgot-password`).
 * Client Component com formulário de email; chama /api/auth/forgot-password para
 * enviar link de redefinição e exibe feedback; link para voltar ao login.
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
import { toast } from 'sonner'
/**
 * Página de solicitação de redefinição de senha por email.
 * @returns JSX.Element
 */
export const ForgotPasswordPage = () => {
	const [email, setEmail] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		setIsLoading(true)
		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			const data = await response.json()
			if (!response.ok) {
				toast.error(data.error || 'Erro ao solicitar reset.')
				return
			}
			toast.success(data.message || 'Se o email existir, enviaremos um link.')
		} catch (error) {
			console.error('Erro ao solicitar reset:', error)
			toast.error('Erro inesperado.')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<div className='min-h-screen flex items-center justify-center bg-muted px-4'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle>Esqueci minha senha</CardTitle>
					<CardDescription>
						Informe seu email para receber o link de redefinição.
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
						<Button type='submit' className='w-full' disabled={isLoading}>
							{isLoading ? 'Enviando...' : 'Enviar link'}
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

export default ForgotPasswordPage
