/**
 * Componente - Model Fisica
 *
 * Visao geral:
 * - Componente React para Model Fisica.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/model/_components/model_fisica";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import {
	FormFisicaData,
	useFormFisica,
} from '@/app/(panel)/dashboard/configurations/model/_components/form_fisica'
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
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Tipo do usuário com dados de assinatura incluídos
type UserModelFisica = Prisma.UserGetPayload<{
	include: {
		subscription: true
	}
}>
interface ModelFisicaProps {
	/** Dados do usuário para preenchimento inicial do formulário */
	user: UserModelFisica
}
export const ModelFisica = ({ user }: ModelFisicaProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const form = useFormFisica({
		name: user.name,
		cpf: user.cpf,
		phone: user.phone,
	})
	const onSubmit = async (values: FormFisicaData) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
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
