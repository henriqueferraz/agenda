'use client'
import { Button } from '@/components/ui/button'
import { Mail, MessageCircle } from 'lucide-react'
import posthog from 'posthog-js'

interface UpgradeCtaButtonsProps {
	whatsappHref: string
	emailHref: string
}

export const UpgradeCtaButtons = ({ whatsappHref, emailHref }: UpgradeCtaButtonsProps) => {
	return (
		<div className='space-y-3'>
			<Button
				className='w-full min-h-[44px] gap-2'
				asChild
			>
				<a
					href={whatsappHref}
					target='_blank'
					rel='noopener noreferrer'
					aria-label='Entrar em contato via WhatsApp'
					onClick={() => posthog.capture('upgrade_whatsapp_clicked')}
				>
					<MessageCircle className='h-4 w-4' />
					Falar via WhatsApp
				</a>
			</Button>
			<Button
				variant='outline'
				className='w-full min-h-[44px] gap-2'
				asChild
			>
				<a
					href={emailHref}
					aria-label='Entrar em contato via email'
					onClick={() => posthog.capture('upgrade_email_clicked')}
				>
					<Mail className='h-4 w-4' />
					Enviar Email
				</a>
			</Button>
		</div>
	)
}
