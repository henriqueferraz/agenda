/**
 * Componente - Model Employee
 *
 * Visao geral:
 * - Componente React para Model Employee.
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
 * import * as modulo from "@/app/(panel)/dashboard/services/employee/_components/model_employee";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
/**
 *  Componente de Gestão de Funcionários
 *
 * Componente React cliente completo para gestão de funcionários, incluindo
 * tabela de listagem e modal de criação. Permite visualização organizada
 * dos dados e adição de novos funcionários com validações completas.
 *
 * ## Funcionalidades
 * -  **Tabela responsiva**: Layout adaptável desktop/mobile com dados organizados
 * -  **Estados visuais**: Funcionários ativos/inativos destacados com badges
 * -  **Modal de criação**: Formulário completo com validações em tempo real
 * -  **Estado vazio**: Mensagem clara quando não há funcionários
 * -  **Formatação automática**: Telefone formatado durante digitação
 * -  **Feedback visual**: Estados de loading, sucesso e erro
 * -  **Performance**: Renderização otimizada e revalidação automática
 *
 * ## Estrutura da Interface
 * ```
 * ┌─ Funcionários ──────────────────────────────────────────────┐
 * │ [Adicionar+]                                               │
 * │                                                            │
 * │ Nome          │ Email         │ Telefone     │ Função      │
 * │ João Silva    │ joao@email    │ (11)99999-   │ Barbeiro    │
 * │ Maria Santos  │ maria@email   │ (11)88888-   │ Manicure    │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Estados dos Funcionários
 * ### Ativos ()
 * - Badge verde "Ativo"
 * - Texto normal
 * - Fundo normal
 *
 * ### Inativos ()
 * - Badge vermelho "Inativo"
 * - Texto esmaecido
 * - Fundo sutilmente diferente
 *
 * ## Modal de Criação
 * ### Campos Obrigatórios
 * - **Nome**: Campo de texto com validação de letras
 * - **Email**: Campo email com validação de formato e unicidade
 * - **Telefone**: Campo com máscara automática de formatação
 * - **Função**: Campo de texto para cargo/função
 *
 * ### Campo Opcional
 * - **Serviço**: Select dropdown com serviços disponíveis
 *
 * ## Responsividade
 * ### Desktop (>768px)
 * - Tabela completa com todas as colunas
 * - Modal centralizado com largura otimizada
 * - Scroll horizontal se necessário
 *
 * ### Mobile (<768px)
 * - Tabela responsiva com scroll
 * - Modal adaptável à tela
 * - Toque otimizado em todos os elementos
 *
 * ## Estados e Feedback
 * - **Carregando**: Spinner visual durante operações
 * - **Sucesso**: Toast verde + modal fecha automaticamente
 * - **Erro**: Toast vermelho com mensagem específica
 * - **Validações**: Bordas vermelhas + mensagens por campo
 *
 * ## Dependências
 * - `EmployeeWithService[]`: Lista de funcionários
 * - Componentes UI: Card, Badge, Table, Dialog, Form
 * - Server Actions: `createEmployee`, `updateEmployee`, `deleteEmployee`
 * - Utils: `formatPhone` para formatação
 *
 * @param employees - Array de funcionários com dados relacionados
 */
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2, Clock } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
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
import { createEmployee } from '../_actions/create-employee'
import { updateEmployee } from '../_actions/update-employee'
import { deleteEmployee } from '../_actions/delete-employee'
import { useFormEmployee, EmployeeFormData } from './form_employee'
import { EmployeeModel as Employee } from '@/lib/generated/prisma/models'
import { formatPhone } from '@/utils/formatPhone'
import { cn } from '@/lib/utils'
import { ModalEmployeeTimes } from './modal-employee-times'
import { getInfoService } from '../../service/_data-access/get_info_service'
import { ServiceModel } from '@/lib/generated/prisma/models'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
type EmployeeWithService = Employee & {
	services?: Array<{
		id: string
		employeeId: string
		serviceId: string
		service: ServiceModel
	}>
}
type Service = ServiceModel
interface ModelEmployeeProps {
	/** Lista de funcionários com dados relacionados */
	employees: EmployeeWithService[]
	/** ID do usuário (empresa) */
	userId: string
}
/**
 * Componente completo de gestão de funcionários
 *
 * Inclui tabela de listagem e modal de criação com todas as funcionalidades
 * de visualização e adição de funcionários.
 *
 * @param props - Propriedades do componente
 * @returns JSX.Element - Interface completa de funcionários
 */
export const ModelEmployee = ({ employees, userId }: ModelEmployeeProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [employeeToEdit, setEmployeeToEdit] =
		useState<EmployeeWithService | null>(null)
	const [employeeToDelete, setEmployeeToDelete] =
		useState<EmployeeWithService | null>(null)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [employeeForTimes, setEmployeeForTimes] =
		useState<EmployeeWithService | null>(null)
	const [isTimesModalOpen, setIsTimesModalOpen] = useState(false)
	const [availableServices, setAvailableServices] = useState<Service[]>([])
	const [isLoadingServices, setIsLoadingServices] = useState(false)
	const form = useFormEmployee()
	// Carregar serviços disponíveis quando o modal abre
	useEffect(() => {
		if (isModalOpen) {
			const loadServices = async () => {
				// Passo 1: validar entradas e garantir o contexto esperado.
				// Passo 2: preparar dados, estado e dependencias locais.
				// Passo 3: executar a acao principal do fluxo.
				// Passo 4: tratar retorno, erros e efeitos colaterais.
				setIsLoadingServices(true)
				try {
					const services = await getInfoService({ userId })
					setAvailableServices(services || [])
				} catch (error) {
					console.error('Erro ao carregar serviços:', error)
					toast.error('Erro ao carregar serviços disponíveis')
				} finally {
					setIsLoadingServices(false)
				}
			}
			loadServices()
		}
	}, [isModalOpen, userId])
	/**
	 * Abre o modal para criar novo funcionário
	 */
	const handleCreate = () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEmployeeToEdit(null)
		form.reset()
		setIsModalOpen(true)
	}
	/**
	 * Abre o modal para editar funcionário existente
	 */
	const handleEdit = (employee: EmployeeWithService) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEmployeeToEdit(employee)
		// Extrair IDs dos serviços relacionados através da relação many-to-many
		const serviceIds = employee.services?.map((es) => es.serviceId) || []
		form.reset({
			name: employee.name,
			email: employee.email,
			phone: employee.phone,
			function: employee.function,
			serviceIds: serviceIds,
		})
		setIsModalOpen(true)
	}
	/**
	 * Abre o diálogo de confirmação para deletar funcionário
	 */
	const handleDeleteClick = (employee: EmployeeWithService) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEmployeeToDelete(employee)
		setIsDeleteDialogOpen(true)
	}
	/**
	 * Abre o modal para configurar horários do funcionário
	 */
	const handleTimesClick = (employee: EmployeeWithService) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEmployeeForTimes(employee)
		setIsTimesModalOpen(true)
	}
	/**
	 * Confirma e executa a exclusão do funcionário
	 */
	const handleDeleteConfirm = async () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		if (!employeeToDelete) return
		try {
			setIsLoading(true)
			const result = await deleteEmployee(employeeToDelete.id)
			if (result.success) {
				toast.success(result.message || 'Funcionário deletado com sucesso!')
				setIsDeleteDialogOpen(false)
				setEmployeeToDelete(null)
				// Recarregar a página para atualizar a lista
				window.location.reload()
			} else {
				toast.error(result.error || 'Erro ao deletar funcionário')
			}
		} catch (error) {
			console.error('Erro ao deletar funcionário:', error)
			toast.error('Erro inesperado. Tente novamente.')
		} finally {
			setIsLoading(false)
		}
	}
	/**
	 * Manipula a submissão do formulário
	 *
	 * Processa os dados do formulário, chama a server action apropriada
	 * (criação ou atualização) e trata os resultados (sucesso/erro).
	 */
	const onSubmit = async (data: EmployeeFormData) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		try {
			setIsLoading(true)
			let result
			if (employeeToEdit) {
				// Atualizar funcionário existente
				result = await updateEmployee({
					id: employeeToEdit.id,
					...data,
				})
			} else {
				// Criar novo funcionário
				result = await createEmployee(data)
			}
			if (result.success) {
				toast.success(
					result.message ||
						(employeeToEdit
							? 'Funcionário atualizado com sucesso!'
							: 'Funcionário criado com sucesso!'),
				)
				form.reset()
				setEmployeeToEdit(null)
				setIsModalOpen(false)
				// Recarregar a página para atualizar a lista
				window.location.reload()
			} else {
				toast.error(
					result.error ||
						(employeeToEdit
							? 'Erro ao atualizar funcionário'
							: 'Erro ao criar funcionário'),
				)
			}
		} catch (error) {
			console.error(
				`Erro ao ${employeeToEdit ? 'atualizar' : 'criar'} funcionário:`,
				error,
			)
			toast.error('Erro inesperado. Tente novamente.')
		} finally {
			setIsLoading(false)
		}
	}
	/**
	 * Manipula mudanças no campo telefone
	 *
	 * Formata automaticamente o telefone durante a digitação,
	 * mantendo apenas números e aplicando máscara.
	 */
	const handlePhoneChange = (value: string) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		// Remove todos os caracteres não numéricos
		const numericValue = value.replace(/\D/g, '')
		// Limita a 11 dígitos (DDD + número)
		const limitedValue = numericValue.slice(0, 11)
		// Aplica formatação automática
		const formatted = formatPhone(limitedValue)
		return formatted
	}
	return (
		<>
			<Card className='w-full'>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='text-center flex-1'>
							<CardTitle className='text-2xl font-bold'>Funcionários</CardTitle>
							<CardDescription className='text-sm mt-1'>
								Lista de todos os funcionários cadastrados na sua empresa.
								Gerencie suas equipes e visualize informações importantes.
							</CardDescription>
						</div>
						<Button
							onClick={handleCreate}
							className='bg-primary hover:bg-primary/90'
							size='sm'
						>
							Adicionar Funcionário
						</Button>
					</div>
				</CardHeader>

				<CardContent>
					{employees.length === 0 ? (
						// Estado vazio - nenhum funcionário encontrado
						<div className='text-center py-8 text-muted-foreground'>
							<p className='text-lg font-medium'>
								Não há funcionários cadastrados
							</p>
							<p className='text-sm'>
								Adicione funcionários para visualizar nesta tabela.
							</p>
						</div>
					) : (
						// Tabela de funcionários
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-[200px]'>Nome</TableHead>
										<TableHead className='w-[250px]'>Email</TableHead>
										<TableHead className='w-[150px]'>Telefone</TableHead>
										<TableHead className='w-[150px]'>Função</TableHead>
										<TableHead className='w-[100px]'>Status</TableHead>
										<TableHead className='w-[100px] text-center'>
											Ações
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{employees.map((employee) => (
										<TableRow key={employee.id}>
											<TableCell className='font-medium'>
												{employee.name}
											</TableCell>
											<TableCell className='text-muted-foreground'>
												{employee.email}
											</TableCell>
											<TableCell>{formatPhone(employee.phone)}</TableCell>
											<TableCell>{employee.function}</TableCell>
											<TableCell>
												<Badge
													variant={employee.status ? 'default' : 'destructive'}
													className={
														employee.status
															? 'bg-green-100 text-green-800 hover:bg-green-100'
															: ''
													}
												>
													{employee.status ? 'Ativo' : 'Inativo'}
												</Badge>
											</TableCell>
											<TableCell>
												<div className='flex items-center justify-center gap-2'>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleTimesClick(employee)}
														className='h-8 w-8'
														title='Configurar horários'
													>
														<Clock className='h-4 w-4' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleEdit(employee)}
														className='h-8 w-8'
														title='Editar funcionário'
													>
														<Pencil className='h-4 w-4' />
													</Button>
													<Button
														variant='ghost'
														size='icon'
														onClick={() => handleDeleteClick(employee)}
														className='h-8 w-8 text-destructive hover:text-destructive'
														title='Deletar funcionário'
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

			{/* Modal de criação/edição de funcionário */}
			<Dialog
				open={isModalOpen}
				onOpenChange={(open) => {
					setIsModalOpen(open)
					if (!open) {
						setEmployeeToEdit(null)
						form.reset()
					}
				}}
			>
				<DialogContent className='sm:max-w-[500px]'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							{employeeToEdit ? 'Editar Funcionário' : 'Adicionar Funcionário'}
						</DialogTitle>
						<DialogDescription>
							{employeeToEdit
								? 'Atualize os dados do funcionário. Todos os campos marcados com * são obrigatórios.'
								: 'Preencha os dados do novo funcionário. Todos os campos marcados com * são obrigatórios.'}
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
							{/* Campo: Nome */}
							<FormField
								control={form.control}
								name='name'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='text-sm font-medium'>
											Nome Completo *
										</FormLabel>
										<FormControl>
											<Input
												placeholder='Digite o nome completo'
												{...field}
												disabled={isLoading}
												className={cn(
													form.formState.errors.name && 'border-destructive',
												)}
											/>
										</FormControl>
										<FormDescription className='text-xs'>
											Nome completo do funcionário (apenas letras)
										</FormDescription>
										<FormMessage className='text-xs' />
									</FormItem>
								)}
							/>

							{/* Campo: Email */}
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='text-sm font-medium'>
											Email *
										</FormLabel>
										<FormControl>
											<Input
												type='email'
												placeholder='funcionario@email.com'
												{...field}
												disabled={isLoading}
												className={cn(
													form.formState.errors.email && 'border-destructive',
												)}
											/>
										</FormControl>
										<FormDescription className='text-xs'>
											Email único para contato.
										</FormDescription>
										<FormMessage className='text-xs' />
									</FormItem>
								)}
							/>

							{/* Campo: Telefone */}
							<FormField
								control={form.control}
								name='phone'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='text-sm font-medium'>
											Telefone *
										</FormLabel>
										<FormControl>
											<Input
												placeholder='(11) 99999-9999'
												{...field}
												disabled={isLoading}
												onChange={(e) => {
													const formatted = handlePhoneChange(e.target.value)
													field.onChange(formatted)
												}}
												className={cn(
													form.formState.errors.phone && 'border-destructive',
												)}
											/>
										</FormControl>
										<FormDescription className='text-xs'>
											Telefone para contato (será formatado automaticamente)
										</FormDescription>
										<FormMessage className='text-xs' />
									</FormItem>
								)}
							/>

							{/* Campo: Função */}
							<FormField
								control={form.control}
								name='function'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='text-sm font-medium'>
											Função/Cargo *
										</FormLabel>
										<FormControl>
											<Input
												placeholder='Ex: Barbeiro, Manicure, Recepcionista'
												{...field}
												disabled={isLoading}
												className={cn(
													form.formState.errors.function &&
														'border-destructive',
												)}
											/>
										</FormControl>
										<FormDescription className='text-xs'>
											Cargo ou função desempenhada na empresa
										</FormDescription>
										<FormMessage className='text-xs' />
									</FormItem>
								)}
							/>

							{/* Campo: Serviços */}
							<FormField
								control={form.control}
								name='serviceIds'
								render={({ field }) => (
									<FormItem>
										<FormLabel className='text-sm font-medium'>
											Serviços que o funcionário realiza
										</FormLabel>
										{isLoadingServices ? (
											<div className='flex items-center justify-center py-4'>
												<Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
												<span className='ml-2 text-sm text-muted-foreground'>
													Carregando serviços...
												</span>
											</div>
										) : availableServices.length === 0 ? (
											<p className='text-sm text-muted-foreground py-4'>
												Nenhum serviço cadastrado. Cadastre serviços primeiro.
											</p>
										) : (
											<div className='h-[100px] w-full rounded-md border p-4 overflow-y-auto'>
												<div className='space-y-3'>
													{availableServices.map((service) => {
														const isChecked =
															field.value?.includes(service.id) || false
														return (
															<div
																key={service.id}
																className='flex items-center space-x-2'
															>
																<Checkbox
																	id={`service-${service.id}`}
																	checked={isChecked}
																	onCheckedChange={(checked) => {
																		const currentValue = field.value || []
																		if (checked) {
																			field.onChange([
																				...currentValue,
																				service.id,
																			])
																		} else {
																			field.onChange(
																				currentValue.filter(
																					(id) => id !== service.id,
																				),
																			)
																		}
																	}}
																	disabled={isLoading}
																/>
																<label
																	htmlFor={`service-${service.id}`}
																	className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1'
																>
																	{service.name}
																</label>
															</div>
														)
													})}
												</div>
											</div>
										)}
										<FormDescription className='text-xs'>
											Selecione os serviços que este funcionário pode realizar
										</FormDescription>
										<FormMessage className='text-xs' />
									</FormItem>
								)}
							/>

							{/* Rodapé com botões */}
							<DialogFooter className='flex gap-2'>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										setIsModalOpen(false)
										setEmployeeToEdit(null)
										form.reset()
									}}
									disabled={isLoading}
								>
									Cancelar
								</Button>
								<Button
									type='submit'
									disabled={isLoading || !form.formState.isValid}
									className='min-w-[120px]'
								>
									{isLoading ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Salvando...
										</>
									) : (
										<>{employeeToEdit ? 'Atualizar' : 'Criar'} Funcionário</>
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
							Tem certeza que deseja excluir o funcionário{' '}
							<strong>{employeeToDelete?.name}</strong>? Esta ação não pode ser
							desfeita.
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
								<>
									<Trash2 className='mr-2 h-4 w-4' />
									Excluir
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Modal de configuração de horários */}
			{employeeForTimes && (
				<ModalEmployeeTimes
					employee={employeeForTimes}
					open={isTimesModalOpen}
					onOpenChange={(open) => {
						setIsTimesModalOpen(open)
						if (!open) {
							setEmployeeForTimes(null)
						}
					}}
					userId={userId}
				/>
			)}
		</>
	)
}
