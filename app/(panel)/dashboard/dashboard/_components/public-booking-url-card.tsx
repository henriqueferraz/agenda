/**
 * Card que exibe a URL pública de agendamento e botão para copiar. Carrega o token
 * via getUserToken; monta a URL com NEXT_PUBLIC_BASE_URL ou origin. Feedback visual ao copiar.
 *
 * @example
 * ```tsx
 * <PublicBookingUrlCard userId={userId} />
 * ```
 */
'use client'
import { useState, useEffect, useMemo } from 'react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getUserToken } from '../_data-access/get-user-token'
/**
 *  Card de URL de Agendamento Público
 *
 * Componente que exibe a URL completa para agendamento externo e permite
 * copiar a URL para a área de transferência com um clique.
 *
 * ## Funcionalidades
 * -  Exibe URL completa de agendamento público
 * -  Botão para copiar URL com um clique
 * -  Feedback visual ao copiar (ícone muda)
 * -  Toast de confirmação ao copiar
 * -  Carregamento automático do token do usuário
 *
 * ## Estrutura da Interface
 * ```
 * ┌─ Link de Agendamento ─────────────────────┐
 * │                                            │
 * │ Link para agendamento externo              │
 * │                                            │
 * │ https://exemplo.com/agendamento/token-123  │
 * │                                            │
 * │ [Ícone de Copiar]                          │
 * └────────────────────────────────────────────┘
 * ```
 *
 * @param userId - ID do usuário (empresa)
 * @returns JSX.Element - Card de URL renderizado
 *
 * @example
 * ```tsx
 * <PublicBookingUrlCard userId="usr_123" />
 * ```
 */
interface PublicBookingUrlCardProps {
	/** ID do usuário (empresa) */
	userId: string
}
export const PublicBookingUrlCard = ({ userId }: PublicBookingUrlCardProps) => {
	const [token, setToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [copied, setCopied] = useState(false)
	// Carrega o token do usuário
	useEffect(() => {
		const loadToken = async () => {
			setIsLoading(true)
			try {
				const userToken = await getUserToken({ userId })
				setToken(userToken)
			} catch (error) {
				console.error('Erro ao carregar token:', error)
				setToken(null)
			} finally {
				setIsLoading(false)
			}
		}
		loadToken()
	}, [userId])
	// Monta a URL completa
	const bookingUrl = useMemo(() => {
		if (!token) return null
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
		if (baseUrl) {
			return `${baseUrl}/agendamento/${token}`
		}
		// Fallback para window.location.origin se disponível
		if (typeof window !== 'undefined') {
			return `${window.location.origin}/agendamento/${token}`
		}
		return null
	}, [token])
	// Função para copiar URL
	const handleCopyUrl = async () => {
		if (!bookingUrl) {
			toast.error('URL não disponível. Configure o nome da empresa primeiro.')
			return
		}
		try {
			await navigator.clipboard.writeText(bookingUrl)
			setCopied(true)
			toast.success('URL copiada para a área de transferência!')
			// Reseta o ícone após 2 segundos
			setTimeout(() => {
				setCopied(false)
			}, 2000)
		} catch (error) {
			console.error('Erro ao copiar URL:', error)
			toast.error('Erro ao copiar URL. Tente novamente.')
		}
	}
	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium'>
					Link de Agendamento
				</CardTitle>
				<LinkIcon className='h-4 w-4 text-muted-foreground' />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className='text-sm text-muted-foreground'>Carregando...</div>
				) : !token ? (
					<div className='space-y-2'>
						<p className='text-xs text-muted-foreground'>
							Configure o nome da empresa em Configurações → Atividade para
							gerar o link.
						</p>
					</div>
				) : (
					<div className='space-y-3'>
						<CardDescription className='text-xs'>
							Compartilhe este link com seus clientes para agendamentos online
						</CardDescription>
						<div className='flex items-center gap-2'>
							<div className='flex-1 min-w-0'>
								<p
									className='text-xs font-mono text-muted-foreground truncate'
									title={bookingUrl || ''}
								>
									{bookingUrl}
								</p>
							</div>
							<Button
								variant='outline'
								size='icon'
								className='h-8 w-8 shrink-0'
								onClick={handleCopyUrl}
								title='Copiar URL'
							>
								{copied ? (
									<Check className='h-4 w-4 text-green-600' />
								) : (
									<Copy className='h-4 w-4' />
								)}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
