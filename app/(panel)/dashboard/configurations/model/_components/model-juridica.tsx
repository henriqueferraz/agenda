/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Componente de formulário para edição de dados de pessoa jurídica.
 *
 * Renderiza formulário com campos de nome, CNPJ e telefone para empresas.
 * Aplica formatação automática de CNPJ e telefone durante a digitação.
 * Permite atualização dos dados através de server action.
 *
 * @example
 * ```typescript
 * import { ModelJuridica } from '@/app/(panel)/dashboard/configurations/model/_components/model-juridica';
 *
 * <ModelJuridica user={userWithSubscription} />
 * ```
 */
'use client'
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
import { FormJuridicaData, useFormJuridica } from './form-juridica'
import { updateModel } from '../_actions/update-model'
import { toast } from 'sonner'
import { formatPhone } from '@/utils/formatPhone'
import { formatCNPJ } from '@/utils/formatCNPJ'

// Tipo do usuário com dados de assinatura incluídos
type UserModelJuridica = Prisma.UserGetPayload<{
	include: {
		subscription: true
	}
}>
interface ModelJuridicaProps {
	/** Dados da empresa para preenchimento inicial do formulário */
	user: UserModelJuridica
}
export const ModelJuridica = ({ user }: ModelJuridicaProps) => {
	const form = useFormJuridica({
		name: user.name,
		cnpj: user.cnpj,
		phone: user.phone,
	})
	const onSubmit = async (values: FormJuridicaData) => {
		const response = await updateModel({
			name: values.name,
			cnpj: values.cnpj,
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
								name='cnpj'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='font-semibold'>
											CNPJ{' '}
											<span className='text-sm font-normal text-muted-foreground'>
												(obrigatório)
											</span>
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder='00.000.000/0000-00'
												value={field.value || ''}
												onChange={(e) => {
													const inputValue = e.target.value
													const cleanValue = inputValue.replace(/\D/g, '')
													// Se estiver limpando o campo, permite
													if (cleanValue === '') {
														field.onChange('')
														return
													}
													// Limita a 14 dígitos
													if (cleanValue.length > 14) {
														return
													}
													// Aplica a formatação usando a função formatCNPJ
													const result = formatCNPJ(cleanValue)
													// Se tem 14 dígitos, usa o resultado formatado
													// Senão, mantém apenas os números para permitir digitação
													if (cleanValue.length === 14) {
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
