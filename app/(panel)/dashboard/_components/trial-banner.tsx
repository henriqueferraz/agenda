/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Banner de trial exibido no topo do dashboard para usuarios enterprise.
 * Mostra dias restantes com codificacao de cores: verde (>7d), amarelo (2-7d), vermelho (ultimo dia).
 * Oculto para usuarios master.
 *
 * @example
 * <TrialBanner role="enterprise" trialEndsAt={new Date('2026-03-22')} />
 */
'use client'

import { AlertTriangle, Clock, Info } from 'lucide-react'

/** Props do componente TrialBanner */
interface TrialBannerProps {
	/** Role do usuario autenticado */
	role: string
	/** Data de fim do trial (null para master) */
	trialEndsAt: Date | null
}

/**
 * Calcula os dias restantes ate o fim do trial.
 * @param trialEndsAt - Data de fim do trial
 * @returns Numero de dias restantes (minimo 0)
 */
const getDaysRemaining = (trialEndsAt: Date): number => {
	const now = new Date()
	const diff = trialEndsAt.getTime() - now.getTime()
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Banner visual de contagem regressiva do trial.
 * Oculto para master. Codificacao de cores conforme proximidade da expiracao.
 *
 * @param props - role e trialEndsAt do usuario
 * @returns JSX.Element ou null se master/sem trial
 */
export const TrialBanner = ({ role, trialEndsAt }: TrialBannerProps) => {
	if (role === 'master' || !trialEndsAt) return null

	const daysRemaining = getDaysRemaining(trialEndsAt)

	if (daysRemaining <= 0) return null

	const isUrgent = daysRemaining <= 1
	const isWarning = daysRemaining <= 7 && daysRemaining > 1
	const isSafe = daysRemaining > 7

	const bannerClasses = isUrgent
		? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200'
		: isWarning
			? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-200'
			: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-200'

	const Icon = isUrgent ? AlertTriangle : isWarning ? Clock : Info

	const message = daysRemaining === 1
		? 'Último dia do período de avaliação!'
		: `${daysRemaining} dias restantes no período de avaliação`

	return (
		<div
			className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 border rounded-lg text-xs sm:text-sm ${bannerClasses}`}
			role='alert'
			aria-label={`Aviso de trial: ${message}`}
		>
			<Icon className='h-4 w-4 shrink-0' />
			<span className='font-medium'>{message}</span>
			{isSafe && (
				<span className='hidden sm:inline text-xs opacity-75 ml-auto'>
					Período de avaliação gratuita
				</span>
			)}
		</div>
	)
}
