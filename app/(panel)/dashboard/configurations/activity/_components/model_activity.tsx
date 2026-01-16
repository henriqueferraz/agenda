/**
 * Componente - Model Activity
 *
 * Visao geral:
 * - Componente React para Model Activity.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/activity/_components/model_activity";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import type { ReactNode } from 'react'
import {
	FormActivityData,
	useFormActivity,
} from '@/app/(panel)/dashboard/configurations/activity/_components/form_activity'
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
import { updateActivity } from '../_actions/update-model'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Tipo do usuário com dados de assinatura incluídos
type UserModelActivity = Prisma.UserGetPayload<{
	include: {
		subscription: true
	}
}>
interface ModelActivityProps {
	user: UserModelActivity
}
export const ModelActivity = ({ user }: ModelActivityProps): ReactNode => {
	// Passo 1: inicializar o formulario com dados atuais do usuario.
	// Passo 2: preparar handlers de submit e validacoes do form.
	// Passo 3: renderizar campos com binds do React Hook Form.
	// Passo 4: expor acao de salvar com feedback visual.
	const form = useFormActivity({
		activity: user.activity,
		be_called: user.be_called,
	})
	const handleSubmit = async (values: FormActivityData): Promise<void> => {
		// Passo 1: montar o payload com os valores atuais do formulario.
		// Passo 2: enviar a atualizacao para o servidor.
		// Passo 3: analisar resposta de sucesso ou erro.
		// Passo 4: exibir feedback ao usuario via toast.
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
													<SelectItem value='Barbearia'>Barbearia</SelectItem>
													<SelectItem value='Cabelereiro'>
														Cabelereiro
													</SelectItem>
													<SelectItem value='Manicure'>Manicure</SelectItem>
													<SelectItem value='Maquiagem'>Maquiagem</SelectItem>
													<SelectItem value='Petshop'>Petshop</SelectItem>
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
