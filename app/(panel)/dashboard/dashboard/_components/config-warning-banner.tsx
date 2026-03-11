/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-03-11
 * @modified 2026-03-11
 * @version 2026.03.11
 * @projectVersion 0.9.0
 */
/**
 * Banner de aviso exibido na Dashboard quando há configurações pendentes.
 * Informa ao usuário que ainda faltam configurações e direciona para o guia de ajuda.
 *
 * @example
 * <ConfigWarningBanner userId="usr_123" />
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { getConfigStatus } from '../../helper/_data-access/get-config-status'

/**
 * Props do componente ConfigWarningBanner.
 */
interface ConfigWarningBannerProps {
	/** ID do usuário para verificar status de configuração */
	userId: string
}

/**
 * Banner de aviso que exibe quando há configurações pendentes.
 * Lista quais configurações ainda faltam e oferece link para o guia de ajuda.
 *
 * @param props - userId
 * @returns JSX.Element ou null se tudo estiver configurado
 */
export const ConfigWarningBanner = async ({
	userId,
}: ConfigWarningBannerProps) => {
	const configStatus = await getConfigStatus({ userId })

	// Verifica se todas as configurações estão completas
	const allConfigured =
		configStatus.activityConfigured &&
		configStatus.modelConfigured &&
		configStatus.addressConfigured &&
		configStatus.timesConfigured &&
		configStatus.servicesConfigured &&
		configStatus.employeesConfigured &&
		configStatus.messagesConfigured

	// Se tudo estiver configurado, não exibe o banner
	if (allConfigured) {
		return null
	}

	// Lista de configurações pendentes
	const pendingConfigs: string[] = []
	if (!configStatus.activityConfigured) {
		pendingConfigs.push('Atividade')
	}
	if (!configStatus.modelConfigured) {
		pendingConfigs.push('Modelo')
	}
	if (!configStatus.addressConfigured) {
		pendingConfigs.push('Endereço')
	}
	if (!configStatus.timesConfigured) {
		pendingConfigs.push('Horários')
	}
	if (!configStatus.servicesConfigured) {
		pendingConfigs.push('Serviços')
	}
	if (!configStatus.employeesConfigured) {
		pendingConfigs.push('Funcionários')
	}
	if (!configStatus.messagesConfigured) {
		pendingConfigs.push('Mensagens')
	}

	return (
		<Alert className='border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'>
			<AlertCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
			<AlertTitle className='text-amber-900 dark:text-amber-100 text-sm sm:text-base font-semibold'>
				Complete suas configurações
			</AlertTitle>
			<AlertDescription className='text-amber-800 dark:text-amber-200 text-xs sm:text-sm mt-2'>
				<p className='mb-2'>
					Ainda faltam algumas configurações para você começar a usar o sistema
					completamente:
				</p>
				<ul className='list-disc list-inside mb-3 space-y-1'>
					{pendingConfigs.map((config) => (
						<li key={config} className='text-xs sm:text-sm'>
							{config}
						</li>
					))}
				</ul>
				<Button
					asChild
					variant='outline'
					size='sm'
					className='w-full sm:w-auto bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 dark:bg-amber-900 dark:hover:bg-amber-800 dark:border-amber-700 dark:text-amber-100 min-h-[44px]'
				>
					<Link href='/dashboard/helper'>
						<HelpCircle className='mr-2 h-4 w-4' />
						Ver guia de configurações
						<ArrowRight className='ml-2 h-4 w-4' />
					</Link>
				</Button>
			</AlertDescription>
		</Alert>
	)
}
