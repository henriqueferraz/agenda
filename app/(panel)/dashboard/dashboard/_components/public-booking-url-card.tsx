/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Card que exibe a URL pública de agendamento com compartilhamento social
 * (WhatsApp, Instagram, Facebook, TikTok), cópia com UTM e métricas por canal.
 *
 * @example
 * ```tsx
 * <PublicBookingUrlCard userId={userId} />
 * ```
 */
'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Copy,
	Check,
	Link as LinkIcon,
	MessageCircle,
	Instagram,
	Facebook,
	Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getUserToken } from '../_data-access/get-user-token'
import {
	getBookingLinkShareStats,
	type BookingLinkShareStats,
} from '../_data-access/get-booking-link-share-stats'
import { trackBookingLinkShare } from '../_actions/track-booking-link-share'

type ShareSource = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'copy'

const UTM_MEDIUM = 'organic'
const UTM_CAMPAIGN = 'booking_link'
const DEFAULT_SHARE_STATS: BookingLinkShareStats = {
	total: 0,
	whatsapp: 0,
	instagram: 0,
	facebook: 0,
	tiktok: 0,
	copy: 0,
}
/**
 *  Card de URL de Agendamento Público
 *
 * Componente que exibe a URL completa para agendamento externo, permite
 * compartilhar por canais sociais e exibe métricas de compartilhamento (30 dias).
 *
 * ## Funcionalidades
 * -  Exibe URL completa de agendamento público
 * -  Botões de compartilhamento social por canal
 * -  Cópia do link com parâmetros UTM por origem
 * -  Feedback visual ao copiar (ícone muda)
 * -  Toast de confirmação ao copiar
 * -  Tracking persistente por canal e exibição de métricas
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
	const [isLoadingStats, setIsLoadingStats] = useState(true)
	const [copied, setCopied] = useState(false)
	const [shareStats, setShareStats] =
		useState<BookingLinkShareStats>(DEFAULT_SHARE_STATS)
	// Carrega o token do usuário
	useEffect(() => {
		const loadCardData = async () => {
			setIsLoading(true)
			setIsLoadingStats(true)
			try {
				const [userToken, stats] = await Promise.all([
					getUserToken({ userId }),
					getBookingLinkShareStats({ userId }),
				])
				setToken(userToken)
				setShareStats(stats)
			} catch (error) {
				console.error('Erro ao carregar dados do card de link público:', error)
				setToken(null)
				setShareStats(DEFAULT_SHARE_STATS)
			} finally {
				setIsLoading(false)
				setIsLoadingStats(false)
			}
		}
		loadCardData()
	}, [userId])
	// Monta a URL completa
	const bookingUrl = useMemo(() => {
		if (!token) return null
		const baseUrl =
			process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL
		if (baseUrl) {
			return `${baseUrl}/agendamento/${token}`
		}
		// Fallback para window.location.origin se disponível
		if (typeof window !== 'undefined') {
			return `${window.location.origin}/agendamento/${token}`
		}
		return null
	}, [token])

	const getBookingUrlWithUtm = useCallback(
		(source: ShareSource): string | null => {
			if (!bookingUrl) {
				return null
			}

			try {
				const url = new URL(bookingUrl)
				url.searchParams.set('utm_source', source)
				url.searchParams.set('utm_medium', UTM_MEDIUM)
				url.searchParams.set('utm_campaign', UTM_CAMPAIGN)
				return url.toString()
			} catch (error) {
				console.error('Erro ao montar URL com UTM:', error)
				return bookingUrl
			}
		},
		[bookingUrl],
	)

	const resetCopiedState = (): void => {
		setCopied(true)
		setTimeout(() => {
			setCopied(false)
		}, 2000)
	}

	const trackShare = async (source: ShareSource): Promise<void> => {
		try {
			const result = await trackBookingLinkShare({ source })
			if (!result.success) {
				return
			}
			setShareStats((currentStats) => ({
				...currentStats,
				[source]: currentStats[source] + 1,
				total: currentStats.total + 1,
			}))
		} catch (error) {
			console.error('Erro ao registrar tracking de compartilhamento:', error)
		}
	}

	const handleCopyUrl = async (source: ShareSource = 'copy'): Promise<void> => {
		const shareUrl = getBookingUrlWithUtm(source)
		if (!shareUrl) {
			toast.error('URL não disponível. Configure o nome da empresa primeiro.')
			return
		}

		try {
			await navigator.clipboard.writeText(shareUrl)
			resetCopiedState()
			await trackShare(source)
			toast.success('URL copiada para a área de transferência!')
		} catch (error) {
			console.error('Erro ao copiar URL:', error)
			toast.error('Erro ao copiar URL. Tente novamente.')
		}
	}

	const handleShareWhatsapp = async (): Promise<void> => {
		const shareUrl = getBookingUrlWithUtm('whatsapp')
		if (!shareUrl) {
			toast.error('URL não disponível para compartilhamento.')
			return
		}

		const text = encodeURIComponent(`Agende seu horário: ${shareUrl}`)
		window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
		await trackShare('whatsapp')
	}

	const handleShareFacebook = async (): Promise<void> => {
		const shareUrl = getBookingUrlWithUtm('facebook')
		if (!shareUrl) {
			toast.error('URL não disponível para compartilhamento.')
			return
		}

		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
			'_blank',
			'noopener,noreferrer',
		)
		await trackShare('facebook')
	}

	const handleShareInstagram = async (): Promise<void> => {
		await handleCopyUrl('instagram')
		toast.info('Cole o link no Instagram para finalizar o compartilhamento.')
	}

	const handleShareTiktok = async (): Promise<void> => {
		const shareUrl = getBookingUrlWithUtm('tiktok')
		if (!shareUrl) {
			toast.error('URL não disponível para compartilhamento.')
			return
		}

		if (typeof navigator.share === 'function') {
			try {
				await navigator.share({
					title: 'Link de Agendamento',
					text: 'Agende seu horário pelo link:',
					url: shareUrl,
				})
				await trackShare('tiktok')
				return
			} catch (error) {
				console.error('Fallback para cópia após falha no Web Share:', error)
			}
		}

		await handleCopyUrl('tiktok')
		toast.info('Cole o link no TikTok para finalizar o compartilhamento.')
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
						<div className='flex flex-col gap-2'>
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
									className='h-8 w-8 min-h-[44px] min-w-[44px] shrink-0'
									onClick={() => handleCopyUrl('copy')}
									title='Copiar URL'
									aria-label='Copiar link de agendamento'
								>
									{copied ? (
										<Check className='h-4 w-4 text-green-600' />
									) : (
										<Copy className='h-4 w-4' />
									)}
								</Button>
							</div>
							<div className='grid grid-cols-2 sm:grid-cols-5 gap-2'>
								<Button
									variant='outline'
									size='sm'
									className='min-h-[44px] w-full'
									onClick={handleShareWhatsapp}
									aria-label='Compartilhar no WhatsApp'
								>
									<MessageCircle className='h-4 w-4' />
									<span>WhatsApp</span>
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='min-h-[44px] w-full'
									onClick={handleShareInstagram}
									aria-label='Compartilhar no Instagram'
								>
									<Instagram className='h-4 w-4' />
									<span>Instagram</span>
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='min-h-[44px] w-full'
									onClick={handleShareFacebook}
									aria-label='Compartilhar no Facebook'
								>
									<Facebook className='h-4 w-4' />
									<span>Facebook</span>
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='min-h-[44px] w-full'
									onClick={handleShareTiktok}
									aria-label='Compartilhar no TikTok'
								>
									<Share2 className='h-4 w-4' />
									<span>TikTok</span>
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='min-h-[44px] w-full'
									onClick={() => handleCopyUrl('copy')}
									aria-label='Copiar link com UTM'
								>
									<Copy className='h-4 w-4' />
									<span>Copiar</span>
								</Button>
							</div>
							<div className='grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground'>
								<p>
									Total 30d:{' '}
									<span className='font-semibold'>{shareStats.total}</span>
								</p>
								<p>
									WhatsApp:{' '}
									<span className='font-semibold'>{shareStats.whatsapp}</span>
								</p>
								<p>
									Instagram:{' '}
									<span className='font-semibold'>{shareStats.instagram}</span>
								</p>
								<p>
									Facebook:{' '}
									<span className='font-semibold'>{shareStats.facebook}</span>
								</p>
								<p>
									TikTok:{' '}
									<span className='font-semibold'>{shareStats.tiktok}</span>
								</p>
								<p>
									Copiar:{' '}
									<span className='font-semibold'>{shareStats.copy}</span>
								</p>
							</div>
							{isLoadingStats ? (
								<p className='text-[11px] text-muted-foreground'>
									Carregando métricas de compartilhamento...
								</p>
							) : null}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
