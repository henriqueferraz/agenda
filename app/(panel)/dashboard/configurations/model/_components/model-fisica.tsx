/**
 * Formulário de dados do usuário (pessoa física): nome, CPF e telefone.
 * Usa form-fisica e updateModel para persistir; formata CPF e telefone na digitação.
 *
 * @example
 * ```tsx
 * <ModelFisica user={userWithSubscription} />
 * ```
 */
'use client'
import {
	FormFisicaData,
	useFormFisica,
} from '@/app/(panel)/dashboard/configurations/model/_components/form-fisica'
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
import { Input } from '@/components/ui/input'
import { Prisma } from '@/lib/generated/prisma/client'
import { updateModel } from '../_actions/update-model'
import { toast } from 'sonner'
import { formatPhone } from '@/utils/formatPhone'
import { formatCPF } from '@/utils/formatCPF'
type UserModelFisica = Prisma.UserGetPayload<{
	include: {
		subscription: true
	}
}>
/** Props do componente ModelFisica. */
interface ModelFisicaProps {
	/** Usuário com name, cpf e phone para preencher o formulário. */
	user: UserModelFisica
}
/**
 * Formulário de pessoa física (nome, CPF, telefone); submit chama updateModel.
 * @param props - user com name, cpf, phone
 * @returns JSX do formulário em CardContent/CardFooter
 */
export const ModelFisica = ({ user }: ModelFisicaProps) => {
	const form = useFormFisica({
		name: user.name,
		cpf: user.cpf,
		phone: user.phone,
	})
	const onSubmit = async (values: FormFisicaData) => {
		const response = await updateModel({
			name: values.name,
			cpf: values.cpf,
			phone: values.phone,
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
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className='grid gap-2'>
						<div className='grid gap-3 pb-3'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='font-semibold'>Nome</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder='Informe seu nome completo'
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className='grid gap-3 pb-3'>
							<FormField
								control={form.control}
								name='cpf'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='font-semibold'>
											CPF{' '}
											<span className='text-sm font-normal text-muted-foreground'>
												(obrigatório)
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder='000.000.000-00'
												value={field.value || ''}
												onChange={(e) => {
													const inputValue = e.target.value
													const cleanValue = inputValue.replace(/\D/g, '')
													// Se estiver limpando o campo, permite
													if (cleanValue === '') {
														field.onChange('')
														return
													}
													// Limita a 11 dígitos
													if (cleanValue.length > 11) {
														return
													}
													// Aplica a formatação usando a função formatCPF
													const result = formatCPF(cleanValue)
													// Se tem 11 dígitos, usa o resultado formatado
													// Senão, mantém apenas os números para permitir digitação
													if (cleanValue.length === 11) {
														field.onChange(result.formatted)
													} else {
														field.onChange(cleanValue)
													}
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className='grid gap-3 pb-3'>
							<FormField
								control={form.control}
								name='phone'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='font-semibold'>Telefone</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder='Informe seu telefone (xx) xxxxx-xxxx'
												onChange={(e) => {
													const formattedValue = formatPhone(e.target.value)
													field.onChange(formattedValue)
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button type='submit' variant={'system'}>
							Salvar
						</Button>
					</CardFooter>
				</form>
			</Form>
		</div>
	)
}
