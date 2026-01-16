/**
 * Componente - Model Address
 *
 * Visao geral:
 * - Componente React para Model Address.
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
 * import * as modulo from "@/app/(panel)/dashboard/configurations/address/_components/model_address";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import {
	FormAddressData,
	useFormAddress,
} from '@/app/(panel)/dashboard/configurations/address/_components/form_address'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
import { updateAddress } from '../_actions/update-address'
import { toast } from 'sonner'
import { searchCep, formatCepDisplay } from '@/utils/cep'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Tipo do usuário com dados de endereço incluídos
type UserAddress = Prisma.UserGetPayload<{
	include: {
		Address: true
		subscription: true
	}
}>
interface ModelAddressProps {
	/** Dados do usuário para preenchimento inicial do formulário */
	user: UserAddress
}
export const ModelAddress = ({ user }: ModelAddressProps) => {
	// Passo 1: iniciar estado local e formulario com dados do usuario.
	// Passo 2: preparar handlers para submit e busca de CEP.
	// Passo 3: renderizar campos de endereco com validacao.
	// Passo 4: exibir feedback de carregamento e erros.
	const [isSearchingCep, setIsSearchingCep] = useState(false)
	const searchRequestIdRef = useRef(0)
	const searchAbortRef = useRef<AbortController | null>(null)
	const form = useFormAddress({
		zip_code: user.Address?.zip_code || user.address || '',
		street: user.Address?.street || '',
		number: user.Address?.number || '',
		complement: user.Address?.complement || '',
		neighborhood: user.Address?.neighborhood || '',
		city: user.Address?.city || '',
		state: user.Address?.state || '',
		country: user.Address?.country || 'Brasil',
	})
	const onSubmit = async (values: FormAddressData) => {
		// Passo 1: montar payload com os valores do formulario.
		// Passo 2: enviar atualizacao para o servidor.
		// Passo 3: interpretar resposta da action.
		// Passo 4: exibir feedback via toast.
		const response = await updateAddress({
			zip_code: values.zip_code,
			street: values.street,
			number: values.number,
			complement: values.complement,
			neighborhood: values.neighborhood,
			city: values.city,
			state: values.state,
			country: values.country,
		})
		if (response?.error) {
			toast.error(response.error)
		} else {
			toast.success(response.data)
		}
	}
	const handleSearchCep = async () => {
		// Passo 1: validar se ha CEP informado.
		// Passo 2: ativar estado de carregamento.
		// Passo 3: consultar o CEP e preencher campos retornados.
		// Passo 4: tratar sucesso, erro e finalizar loading.
		const cepValue = form.getValues('zip_code')
		if (!cepValue || cepValue.trim() === '') {
			toast.error('Por favor, informe um CEP.')
			return
		}
		searchRequestIdRef.current += 1
		const requestId = searchRequestIdRef.current
		searchAbortRef.current?.abort()
		const controller = new AbortController()
		searchAbortRef.current = controller
		setIsSearchingCep(true)
		try {
			const result = await searchCep(cepValue, { signal: controller.signal })
			if (
				requestId !== searchRequestIdRef.current ||
				controller.signal.aborted
			) {
				return
			}
			if (result.success && result.data) {
				// Preenche os campos com os dados retornados
				form.setValue('street', result.data.logradouro || '')
				form.setValue('neighborhood', result.data.bairro || '')
				form.setValue('city', result.data.localidade || '')
				form.setValue('state', result.data.uf || '')
				form.setValue('country', 'Brasil')
				// Formata o CEP no campo
				form.setValue('zip_code', formatCepDisplay(result.data.cep))
				toast.success('Endereço encontrado e preenchido automaticamente!')
			} else {
				toast.error(result.error || 'Erro ao buscar CEP.')
			}
		} catch (error) {
			if (controller.signal.aborted) {
				return
			}
			toast.error('Erro inesperado ao buscar CEP. Tente novamente.')
			console.error('Erro na busca de CEP:', error)
		} finally {
			if (requestId === searchRequestIdRef.current) {
				setIsSearchingCep(false)
			}
		}
	}
	useEffect(() => {
		// Passo 1: registrar cleanup do componente.
		// Passo 2: abortar busca de CEP pendente.
		return () => {
			searchAbortRef.current?.abort()
		}
	}, [])
	return (
		<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
			<Card className='w-full max-w-2xl'>
				<CardHeader className='text-center'>
					<CardTitle className='text-2xl font-bold'>
						Qual o endereço da sua empresa?
					</CardTitle>
					<CardDescription className='text-sm'>
						Informe o endereço da sua empresa. Você pode buscar automaticamente
						pelo CEP.
					</CardDescription>
				</CardHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<CardContent className='grid gap-4'>
							{/* Campo CEP com botão de busca */}
							<div className='grid gap-3'>
								<FormField
									control={form.control}
									name='zip_code'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>CEP</FormLabel>
											<div className='grid grid-cols-3 gap-3'>
												<div className='col-span-1'>
													<FormControl>
														<Input
															{...field}
															placeholder='00000-000'
															value={field.value || ''}
															onChange={(e) => {
																const inputValue = e.target.value
																const cleanValue = inputValue.replace(/\D/g, '')
																// Limita a 8 dígitos
																if (cleanValue.length > 8) {
																	return
																}
																// Aplica formatação automática
																if (cleanValue.length === 8) {
																	field.onChange(formatCepDisplay(cleanValue))
																} else {
																	field.onChange(cleanValue)
																}
															}}
														/>
													</FormControl>
												</div>
												<div className='col-span-2'>
													<Button
														type='button'
														variant='system'
														onClick={handleSearchCep}
														disabled={isSearchingCep}
														className='w-full h-full'
													>
														{isSearchingCep ? (
															<>
																<Loader2 className='mr-2 h-4 w-4 animate-spin' />
																Buscando...
															</>
														) : (
															'Buscar CEP'
														)}
													</Button>
												</div>
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Campos de endereço em grid responsivo */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='md:col-span-2'>
									<FormField
										control={form.control}
										name='street'
										render={({ field }) => (
											<FormItem>
												<FormLabel className='font-semibold'>
													Logradouro
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														placeholder='Rua, Avenida, Alameda...'
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name='number'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>Número</FormLabel>
											<FormControl>
												<Input {...field} placeholder='Informe o número' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='complement'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>
												Complemento{' '}
												<span className='text-sm font-normal text-muted-foreground'>
													(opcional)
												</span>
											</FormLabel>
											<FormControl>
												<Input {...field} placeholder='Apto, Sala, Andar...' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='neighborhood'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>Bairro</FormLabel>
											<FormControl>
												<Input {...field} placeholder='Nome do bairro' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='city'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>Cidade</FormLabel>
											<FormControl>
												<Input {...field} placeholder='Nome da cidade' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='state'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>Estado</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder='UF (ex: SP, RJ)'
													maxLength={2}
													value={field.value || ''}
													onChange={(e) => {
														const value = e.target.value.toUpperCase()
														field.onChange(value)
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='country'
									render={({ field }) => (
										<FormItem>
											<FormLabel className='font-semibold'>País</FormLabel>
											<FormControl>
												<Input {...field} placeholder='Nome do país' />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>

						<CardFooter>
							<Button type='submit' variant='system' className='w-full mt-4'>
								Salvar Endereço
							</Button>
						</CardFooter>
					</form>
				</Form>
			</Card>
		</div>
	)
}
