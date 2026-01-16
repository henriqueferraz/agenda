/**
 * Pagina - /forgot-password
 *
 * Visao geral:
 * - Componente de pagina para a rota `/forgot-password`, organizado no App Router.
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
 * import * as modulo from "@/app/(public)/forgot-password/page";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
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
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const ForgotPasswordPage = () => {
	const [email, setEmail] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const handleSubmit = async (event: React.FormEvent) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
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
