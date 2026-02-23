/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Formulário de configuração de atividade e como ser chamado.
 * Renderiza campos para seleção de categoria (Barbearia, Cabelereiro, etc.) e
 * texto "Como você gostaria de ser chamado", persiste via updateActivity.
 *
 * @example
 * ```tsx
 * <ModelActivity user={userWithSubscription} />
 * ```
 */
'use client'
import type { ReactNode } from 'react'
import {
	ALLOWED_ACTIVITIES,
	FormActivityData,
	useFormActivity,
} from '@/app/(panel)/dashboard/configurations/activity/_components/form-activity'
import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Prisma } from '@/lib/generated/prisma/client'
import { toast } from 'sonner'
import { updateActivity } from '../_actions/update-activity'
type UserModelActivity = Prisma.UserGetPayload<{
	include: {
		subscription: true
	}
}>
/** Props do componente ModelActivity. */
interface ModelActivityProps {
	/** Usuário com activity, be_called e subscription para preencher o formulário. */
	user: UserModelActivity
}
/**
 * Formulário de atividade e como ser chamado; submit chama updateActivity.
 * @param props - user com activity e be_called
 * @returns JSX do formulário dentro de CardContent/CardFooter
 */
export const ModelActivity = ({ user }: ModelActivityProps): ReactNode => {
	const form = useFormActivity({
		activity: user.activity,
		be_called: user.be_called,
	})
	const handleSubmit = async (values: FormActivityData): Promise<void> => {
		const response = await updateActivity({
			activity: values.activity,
			be_called: values.be_called,
		})
		if (response?.error) {
			toast.error(response.error)
		} else {
			toast.success(response.data)
		}
	}
	return (
		<div className='grid gap-6'>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<CardContent className='grid gap-2'>
						<div className='grid gap-3 pb-3'>
							<FormField
								control={form.control}
								name='activity'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='font-semibold'>
											Atividade <span className='text-red-500'>*</span>
										</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												value={field.value || ''}
											>
												<SelectTrigger className='w-full'>
													<SelectValue placeholder='Selecione a categoria' />
												</SelectTrigger>
											<SelectContent>
												{ALLOWED_ACTIVITIES.map((act) => (
													<SelectItem key={act} value={act}>
														{act}
													</SelectItem>
												))}
											</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='be_called'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='font-semibold'>
											Como você gostaria de ser chamado{' '}
											<span className='text-red-500'>*</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder='Ex: João, Dr. Silva, etc.'
												className='w-full'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button type='submit' variant='system'>
							Salvar
						</Button>
					</CardFooter>
				</form>
			</Form>
		</div>
	)
}
