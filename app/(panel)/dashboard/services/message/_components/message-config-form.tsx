/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-18
 * @modified 2026-02-18
 * @version 2026.02.18
 * @projectVersion 0.9.0
 */
/**
 * Formulário de configuração de lembretes automáticos (F-03).
 * Permite ativar/desativar intervalos (7d, 24h, 2h) e escolher canal de envio.
 * Chama updateMessageConfig server action ao salvar.
 *
 * @example
 * ```tsx
 * <MessageConfigForm config={config} userId={userId} />
 * ```
 */
'use client'
import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, Clock, Loader2, Save } from 'lucide-react'
import { updateMessageConfig } from '../_actions/update-message-config'
import type { MessageConfigData } from '../_data-access/get-message-config'

/** Props do componente MessageConfigForm. */
interface MessageConfigFormProps {
	/** Configuração atual do usuário (ou defaults). */
	config: MessageConfigData
	/** ID do usuário (empresa). */
	userId: string
}

/**
 * Formulário de configuração de lembretes com toggles e select de canal.
 *
 * @param props - config e userId
 * @returns React.ReactElement
 */
export const MessageConfigForm = ({
	config,
}: MessageConfigFormProps): React.ReactElement => {
	const [reminder7d, setReminder7d] = useState(config.reminder7d)
	const [reminder24h, setReminder24h] = useState(config.reminder24h)
	const [reminder2h, setReminder2h] = useState(config.reminder2h)
	const [reminderChannel, setReminderChannel] = useState(config.reminderChannel)
	const [isPending, startTransition] = useTransition()

	const hasChanges =
		reminder7d !== config.reminder7d ||
		reminder24h !== config.reminder24h ||
		reminder2h !== config.reminder2h ||
		reminderChannel !== config.reminderChannel

	const handleSave = (): void => {
		startTransition(async () => {
			const result = await updateMessageConfig({
				reminder7d,
				reminder24h,
				reminder2h,
				reminderChannel: reminderChannel as 'whatsapp' | 'email' | 'both',
			})

			if (result.success) {
				toast.success(result.message)
			} else {
				toast.error(result.error)
			}
		})
	}

	const activeCount = [reminder7d, reminder24h, reminder2h].filter(Boolean).length

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
					<Bell className='h-5 w-5' />
					Lembretes Automáticos
				</CardTitle>
				<CardDescription>
					Configure quais lembretes serão enviados automaticamente para os clientes
					com o link de cancelar/reagendar.
					{activeCount > 0 && (
						<span className='ml-1 font-medium text-primary'>
							({activeCount} {activeCount === 1 ? 'ativo' : 'ativos'})
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-6'>
				<div className='space-y-4'>
					<div className='flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4'>
						<div className='flex items-center gap-3'>
							<Clock className='h-4 w-4 shrink-0 text-muted-foreground' />
							<div>
								<Label htmlFor='reminder-7d' className='text-sm font-medium'>
									7 dias antes
								</Label>
								<p className='text-xs text-muted-foreground'>
									Lembrete com uma semana de antecedência
								</p>
							</div>
						</div>
						<Switch
							id='reminder-7d'
							checked={reminder7d}
							onCheckedChange={setReminder7d}
							aria-label='Ativar lembrete 7 dias antes'
							className='data-[state=checked]:bg-green-500'
						/>
					</div>

					<div className='flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4'>
						<div className='flex items-center gap-3'>
							<Clock className='h-4 w-4 shrink-0 text-muted-foreground' />
							<div>
								<Label htmlFor='reminder-24h' className='text-sm font-medium'>
									24 horas antes
								</Label>
								<p className='text-xs text-muted-foreground'>
									Lembrete no dia anterior ao agendamento
								</p>
							</div>
						</div>
						<Switch
							id='reminder-24h'
							checked={reminder24h}
							onCheckedChange={setReminder24h}
							aria-label='Ativar lembrete 24 horas antes'
							className='data-[state=checked]:bg-green-500'
						/>
					</div>

					<div className='flex items-center justify-between gap-4 rounded-lg border p-3 sm:p-4'>
						<div className='flex items-center gap-3'>
							<Clock className='h-4 w-4 shrink-0 text-muted-foreground' />
							<div>
								<Label htmlFor='reminder-2h' className='text-sm font-medium'>
									2 horas antes
								</Label>
								<p className='text-xs text-muted-foreground'>
									Lembrete pouco antes do horário marcado
								</p>
							</div>
						</div>
						<Switch
							id='reminder-2h'
							checked={reminder2h}
							onCheckedChange={setReminder2h}
							aria-label='Ativar lembrete 2 horas antes'
							className='data-[state=checked]:bg-green-500'
						/>
					</div>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='reminder-channel' className='text-sm font-medium'>
						Canal de envio
					</Label>
					<Select
						value={reminderChannel}
						onValueChange={setReminderChannel}
					>
						<SelectTrigger id='reminder-channel' className='w-full sm:w-64'>
							<SelectValue placeholder='Selecione o canal' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='whatsapp'>WhatsApp</SelectItem>
							<SelectItem value='email'>E-mail</SelectItem>
							<SelectItem value='both'>Ambos (WhatsApp + E-mail)</SelectItem>
						</SelectContent>
					</Select>
					<p className='text-xs text-muted-foreground'>
						Escolha por onde os lembretes serão enviados aos clientes
					</p>
				</div>

				<div className='flex justify-end'>
					<Button
						onClick={handleSave}
						disabled={isPending || !hasChanges}
						className='min-h-[44px] min-w-[44px]'
						aria-label='Salvar configurações de lembretes'
					>
						{isPending ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Salvando...
							</>
						) : (
							<>
								<Save className='mr-2 h-4 w-4' />
								Salvar configurações
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
