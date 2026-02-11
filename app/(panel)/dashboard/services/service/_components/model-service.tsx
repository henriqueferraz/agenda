/**
 * Componente de gestão de serviços: tabela de serviços (nome, preço, duração, status),
 * modal de criação/edição com formulário validado, conversão preço reais↔centavos e
 * duração horas/minutos↔minutos. Ações: createService, updateService, deleteService.
 *
 * @example
 * ```tsx
 * <ModelService services={await getInfoService({ userId })} />
 * ```
 */
'use client'
/**
 *  Componente de Gestão de Serviços
 *
 * Componente React cliente para exibição e criação de serviços cadastrados,
 * incluindo tabela responsiva dentro de um Card e modal de cadastro.
 * Mostra informações dos serviços como nome, preço, duração e status.
 *
 * ## Funcionalidades
 * -  **Tabela responsiva**: Layout adaptável desktop/mobile
 * -  **Estados visuais**: Serviços ativos/inativos destacados com badges
 * -  **Estado vazio**: Mensagem clara quando não há serviços
 * -  **Formatação de preço**: Exibição formatada em reais (R$)
 * -  **Formatação de duração**: Exibição em minutos
 * -  **Modal de criação**: Formulário completo com validações
 * -  **Conversão automática**: Preço de reais para centavos ao salvar
 *
 * ## Fluxo de Dados
 * - **Formulário**: Trabalha com preço em reais e duração em horas/minutos
 * - **onSubmit**: Converte preço para centavos e duração para minutos totais
 * - **Server Actions**: Recebem valores já convertidos (centavos e minutos)
 * - **Banco de Dados**: Armazena preço em centavos e duração em minutos
 * - **Edição**: Converte de centavos para reais e minutos para horas/minutos
 *
 * ## Estrutura da Interface
 * ```
 * ┌─ Serviços ──────────────────────────────────────────────┐
 * │ [Adicionar+]                                             │
 * │                                                         │
 * │ Nome          │ Preço      │ Duração    │ Status       │
 * │ Corte         │ R$ 30,00   │ 30 min     │ Ativo        │
 * │ Barba         │ R$ 20,00   │ 20 min     │ Ativo        │
 * └─────────────────────────────────────────────────────────┘
 * ```
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { ServiceModel } from '@/lib/generated/prisma/models'
import { formatCurrency } from '@/lib/utils'
import { useFormService, ServiceFormData } from './form-service'
import { Control } from 'react-hook-form'
import { createService } from '../_actions/create-service'
import { updateService } from '../_actions/update-service'
import { deleteService } from '../_actions/delete-service'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
const PriceInputField = ({
	control,
}: {
	control: Control<ServiceFormData>
}) => {
	return (
		<FormField
			control={control}
			name='price'
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel>Preço (em reais)</FormLabel>
						<FormControl>
							<Input
								type='number'
								placeholder='Ex: 30,00'
								{...field}
								onChange={(e) =>
									field.onChange(parseFloat(e.target.value) || 0)
								}
							/>
						</FormControl>
						<FormDescription className='text-xs'>
							Preço do serviço em reais (ex: 30,00)
						</FormDescription>
						<FormMessage />
					</FormItem>
				)
			}}
		/>
	)
}
type Service = ServiceModel
interface ModelServiceProps {
	/** Lista de serviços cadastrados */
	services: Service[]
}
/**
 * Formata a duração em minutos para exibição
 *
 * @param duration - Duração em minutos
 * @returns String formatada como "X min" ou "X h Y min"
 */
const formatDuration = (duration: number): string => {
	if (duration < 60) {
		return `${duration} min`
	}
	const hours = Math.floor(duration / 60)
	const minutes = duration % 60
	if (minutes === 0) {
		return `${hours} h`
	}
	return `${hours} h ${minutes} min`
}
/**
 * Componente de gestão de serviços
 *
 * Renderiza uma tabela com os serviços cadastrados dentro de um Card.
 * Exibe informações como nome, preço formatado, duração e status.
 * Inclui modal para criação de novos serviços.
 *
 * @param props - Propriedades do componente
 * @returns JSX.Element - Interface completa de gestão de serviços
 *
 * @example
 * ```tsx
 * const services = await getInfoService({ userId: "usr_123" });
 * <ModelService services={services} />
 * ```
 */
export const ModelService = ({ services }: ModelServiceProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null)
	const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const form = useFormService()
	/**
	 * Manipula a abertura do modal de criação
	 */
	const handleCreate = () => {
		setServiceToEdit(null)
		form.reset({
			name: '',
			price: 0, // Em reais (será convertido para centavos no onSubmit)
			hours: 0,
			minutes: 0,
		})
		setIsModalOpen(true)
	}
	/**
	 * Manipula a edição de um serviço
	 */
	const handleEdit = (service: Service) => {
		// Converter preço de centavos para reais
		const priceInReais = service.price / 100
		// Converter minutos totais para horas e minutos
		const hours = Math.floor(service.duration / 60)
		const minutes = service.duration % 60
		form.reset({
			name: service.name,
			price: priceInReais, // Converter centavos para reais
			hours: hours,
			minutes: minutes,
		})
		setServiceToEdit(service)
		setIsModalOpen(true)
	}
	/**
	 * Manipula o clique no botão de deletar
	 */
	const handleDeleteClick = (service: Service) => {
		setServiceToDelete(service)
		setIsDeleteDialogOpen(true)
	}
	/**
	 * Confirma a exclusão do serviço
	 */
	const handleDeleteConfirm = async () => {
		if (!serviceToDelete) return
		try {
			setIsLoading(true)
			const result = await deleteService(serviceToDelete.id)
			if (result.success) {
				toast.success(result.message || 'Serviço deletado com sucesso!')
				setIsDeleteDialogOpen(false)
				setServiceToDelete(null)
				// Recarregar a página para atualizar a lista
				window.location.reload()
			} else {
				toast.error(result.error || 'Erro ao deletar serviço')
			}
		} catch (error) {
			console.error('Erro ao deletar serviço:', error)
			toast.error('Erro inesperado. Tente novamente.')
		} finally {
			setIsLoading(false)
		}
	}
	/**
	 * Manipula a submissão do formulário
	 * Converte preço de reais para centavos e duração de horas/minutos para minutos totais
	 */
	const onSubmit = async (data: ServiceFormData) => {
		try {
			setIsLoading(true)
			// Converter preço de reais para centavos antes de gravar no banco
			const priceInCents = Math.round((data.price || 0) * 100)
			// Converter horas e minutos para minutos totais
			const durationInMinutes = data.hours * 60 + data.minutes
			let result
			if (serviceToEdit) {
				// Atualizar serviço existente
				result = await updateService({
					id: serviceToEdit.id,
					name: data.name,
					price: priceInCents,
					duration: durationInMinutes,
				})
			} else {
				// Criar novo serviço
				result = await createService({
					name: data.name,
					price: priceInCents,
					duration: durationInMinutes,
				})
			}
			if (result.success) {
				toast.success(
					result.message ||
					(serviceToEdit
						? 'Serviço atualizado com sucesso!'
						: 'Serviço criado com sucesso!'),
				)
				setServiceToEdit(null)
				form.reset({
					name: '',
					price: 0,
					hours: 0,
					minutes: 0,
				})
				setIsModalOpen(false)
				// Recarregar a página para atualizar a lista
				window.location.reload()
			} else {
				toast.error(
					result.error ||
					(serviceToEdit
						? 'Erro ao atualizar serviço'
						: 'Erro ao criar serviço'),
				)
			}
		} catch (error) {
			console.error('Erro ao criar serviço:', error)
			toast.error('Erro inesperado. Tente novamente.')
		} finally {
			setIsLoading(false)
		}
	}
	return (
		<>
			<Card className='w-full'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='text-center flex-1'>
							<CardTitle className='text-2xl font-bold'>Serviços</CardTitle>
							<CardDescription className='text-sm mt-1'>
								Lista de todos os serviços cadastrados na sua empresa. Visualize
								informações sobre preços, duração e status.
							</CardDescription>
						</div>
						<Button
							onClick={handleCreate}
							className='bg-primary hover:bg-primary/90'
							size='sm'
						>
							Adicionar Serviço
						</Button>
					</div>
				</CardHeader>

				<CardContent>
					{services.length === 0 ? (
						// Estado vazio - nenhum serviço encontrado
						<div className='text-center py-8 text-muted-foreground'>
							<p className='text-lg font-medium'>Não há serviços cadastrados</p>
							<p className='text-sm'>
								Adicione serviços para visualizar nesta tabela.
							</p>
						</div>
					) : (
						// Tabela de serviços
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[250px]'>Nome</TableHead>
										<TableHead className='w-[150px]'>Preço</TableHead>
										<TableHead className='w-[150px]'>Duração</TableHead>
										<TableHead className='w-[100px]'>Status</TableHead>
										<TableHead className='w-[100px] text-center'>
											Ações
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{services.map((service) => (
										<TableRow key={service.id}>
											<TableCell className='font-medium'>
												{service.name}
											</TableCell>
											<TableCell>{formatCurrency(service.price)}</TableCell>
											<TableCell>{formatDuration(service.duration)}</TableCell>
											<TableCell>
												<Badge
													variant={service.status ? 'default' : 'destructive'}
													className={
														service.status
															? 'bg-green-100 text-green-800 hover:bg-green-100'
															: ''
													}
												>
													{service.status ? 'Ativo' : 'Inativo'}
												</Badge>
											</TableCell>
											<TableCell>
												<div className='flex items-center justify-center gap-2'>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleEdit(service)}
														className='h-8 w-8'
														title='Editar serviço'
													>
														<Pencil className='h-4 w-4' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleDeleteClick(service)}
														className='h-8 w-8 text-destructive hover:text-destructive'
														title='Deletar serviço'
													>
														<Trash2 className='h-4 w-4' />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Modal de criação de serviço */}
			<Dialog
				open={isModalOpen}
				onOpenChange={(open) => {
					setIsModalOpen(open)
					if (!open) {
						// Limpar formulário quando o modal é fechado
						setServiceToEdit(null)
						form.reset({
							name: '',
							price: 0.0,
							hours: 0,
							minutes: 0,
						})
					}
				}}
			>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle>
							{serviceToEdit ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
						</DialogTitle>
						<DialogDescription>
							{serviceToEdit
								? 'Atualize os dados do serviço abaixo.'
								: 'Preencha os dados abaixo para cadastrar um novo serviço.'}
							Todos os campos são obrigatórios.
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome do Serviço</FormLabel>
										<FormControl>
											<Input placeholder='Ex: Corte de Cabelo' {...field} />
										</FormControl>
										<FormDescription className='text-xs'>
											Nome do serviço oferecido
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<PriceInputField control={form.control} />

							<div className='grid grid-cols-2 gap-4'>
								<FormField
									control={form.control}
									name='hours'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Horas</FormLabel>
											<FormControl>
												<Input
													type='number'
													placeholder='Ex: 1'
													{...field}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value) || 0)
													}
													min='0'
													max='8'
												/>
											</FormControl>
											<FormDescription className='text-xs'>
												Horas de duração do serviço
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='minutes'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Minutos</FormLabel>
											<FormControl>
												<Input
													type='number'
													placeholder='Ex: 30'
													{...field}
													onChange={(e) =>
														field.onChange(parseInt(e.target.value) || 0)
													}
													min='0'
													max='59'
												/>
											</FormControl>
											<FormDescription className='text-xs'>
												Minutos de duração do serviço
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<DialogFooter>
								<Button
									type='button'
									variant='outline'
									onClick={() => setIsModalOpen(false)}
									disabled={isLoading}
								>
									Cancelar
								</Button>
								<Button
									type='submit'
									disabled={isLoading}
									className='min-w-[120px]'
								>
									{isLoading ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											{serviceToEdit ? 'Salvando...' : 'Criando...'}
										</>
									) : serviceToEdit ? (
										'Salvar Alterações'
									) : (
										'Criar Serviço'
									)}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Dialog de confirmação de exclusão */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir o serviço{' '}
							<strong>{serviceToDelete?.name}</strong>?
							<br />
							Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							disabled={isLoading}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Excluindo...
								</>
							) : (
								'Excluir'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
