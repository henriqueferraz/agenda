/**
 * Componente - Public Booking Url Card
 *
 * Visao geral:
 * - Componente React para Public Booking Url Card.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Renderizar UI com props previsiveis.
 * - Isolar estilos e comportamento do componente.
 * - Facilitar reutilizacao em outras telas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/(panel)/dashboard/dashboard/_components/public-booking-url-card";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
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
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
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
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const [token, setToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [copied, setCopied] = useState(false)
	// Carrega o token do usuário
	useEffect(() => {
		const loadToken = async () => {
			// Passo 1: validar entradas e garantir o contexto esperado.
			// Passo 2: preparar dados, estado e dependencias locais.
			// Passo 3: executar a acao principal do fluxo.
			// Passo 4: tratar retorno, erros e efeitos colaterais.
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
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
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
