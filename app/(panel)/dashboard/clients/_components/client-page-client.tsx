/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Cliente da página de Clientes: layout com SidebarInset, breadcrumb (Dashboard > Clientes),
 * barra de busca, botão de criar, tabela desktop + cards mobile, paginação e dialogs.
 *
 * @example
 * ```tsx
 * <ClientPageClient initialClients={clients} initialTotal={50} />
 * ```
 */
'use client'
import { useState } from 'react'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Plus, Search, Pencil, Phone, Mail, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ClientFormDialog } from './client-form-dialog'
import { maskCPF } from '@/utils/formatCPF'
import { formatPhone } from '@/utils/formatPhone'

/** Tipo do cliente retornado pelo data-access */
interface ClientItem {
	id: string
	name: string
	email: string
	phone: string
	cpf: string
	notes: string | null
	createdAt: Date
	updatedAt: Date
	_count: { appointments: number }
}

/** Props do componente */
interface ClientPageClientProps {
	/** Lista inicial de clientes */
	initialClients: ClientItem[]
	/** Total de clientes para paginação */
	initialTotal: number
}

/**
 * Componente client da página de clientes com busca, listagem e paginação.
 *
 * @param props - Dados iniciais de clientes
 * @returns JSX.Element
 */
export const ClientPageClient = ({
	initialClients,
	initialTotal,
}: ClientPageClientProps) => {
	const router = useRouter()
	const [search, setSearch] = useState('')
	const [page] = useState(1)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingClient, setEditingClient] = useState<ClientItem | null>(null)
	const perPage = 20
	const totalPages = Math.ceil(initialTotal / perPage)

	const handleSearch = () => {
		router.refresh()
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') handleSearch()
	}

	const handleEdit = (client: ClientItem) => {
		setEditingClient(client)
		setDialogOpen(true)
	}

	const handleCreate = () => {
		setEditingClient(null)
		setDialogOpen(true)
	}

	const handleDialogClose = () => {
		setDialogOpen(false)
		setEditingClient(null)
	}

	const handleSuccess = () => {
		handleDialogClose()
		router.refresh()
	}

	return (
		<SidebarInset>
			<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
				<div className='flex items-center gap-2 px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Clientes</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className='flex items-center justify-center p-4 sm:p-6 md:p-8'>
				<div className='w-full max-w-6xl space-y-4 sm:space-y-6'>
					<Card>
						<CardHeader className='p-4 sm:p-6'>
							<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
								<CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
									<User className='h-5 w-5' />
									Clientes ({initialTotal})
								</CardTitle>
								<Button
									onClick={handleCreate}
									className='min-h-[44px] min-w-[44px]'
									aria-label='Cadastrar novo cliente'
								>
									<Plus className='mr-2 h-4 w-4' />
									Novo Cliente
								</Button>
							</div>
							<div className='mt-4 flex gap-2'>
								<Input
									placeholder='Buscar por nome, email, telefone ou CPF...'
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									onKeyDown={handleKeyDown}
									className='min-h-[44px]'
									aria-label='Campo de busca de clientes'
								/>
								<Button
									variant='outline'
									onClick={handleSearch}
									className='min-h-[44px] min-w-[44px]'
									aria-label='Buscar clientes'
								>
									<Search className='h-4 w-4' />
								</Button>
							</div>
						</CardHeader>
						<CardContent className='p-4 sm:p-6 pt-0 sm:pt-0'>
							{initialClients.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
									<User className='mb-4 h-12 w-12 opacity-50' />
									<p className='text-base sm:text-lg font-medium'>Nenhum cliente encontrado</p>
									<p className='text-sm'>Cadastre seu primeiro cliente clicando no botão acima.</p>
								</div>
							) : (
								<>
									{/* Tabela desktop */}
									<div className='hidden md:block'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Nome</TableHead>
													<TableHead>CPF</TableHead>
													<TableHead>Email</TableHead>
													<TableHead>Telefone</TableHead>
													<TableHead className='text-center'>Agendamentos</TableHead>
													<TableHead className='text-right'>Ações</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{initialClients.map((client) => (
													<TableRow key={client.id}>
														<TableCell className='font-medium'>{client.name}</TableCell>
													<TableCell>{maskCPF(client.cpf)}</TableCell>
														<TableCell>{client.email}</TableCell>
														<TableCell>{formatPhone(client.phone)}</TableCell>
														<TableCell className='text-center'>{client._count.appointments}</TableCell>
														<TableCell className='text-right'>
															<Button
																variant='ghost'
																size='icon'
																onClick={() => handleEdit(client)}
																className='min-h-[44px] min-w-[44px]'
																aria-label={`Editar cliente ${client.name}`}
															>
																<Pencil className='h-4 w-4' />
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>

									{/* Cards mobile */}
									<div className='grid grid-cols-1 gap-3 md:hidden'>
										{initialClients.map((client) => (
											<Card key={client.id} className='p-4'>
												<div className='flex items-start justify-between'>
													<div className='space-y-1'>
													<p className='font-medium'>{client.name}</p>
													<p className='text-xs text-muted-foreground'>
														CPF: {maskCPF(client.cpf)}
													</p>
														<div className='flex items-center gap-1 text-sm text-muted-foreground'>
															<Mail className='h-3 w-3' />
															{client.email}
														</div>
														<div className='flex items-center gap-1 text-sm text-muted-foreground'>
															<Phone className='h-3 w-3' />
															{formatPhone(client.phone)}
														</div>
														<p className='text-xs text-muted-foreground'>
															{client._count.appointments} agendamento(s)
														</p>
													</div>
												<Button
													variant='ghost'
													size='icon'
													onClick={() => handleEdit(client)}
													className='min-h-[44px] min-w-[44px]'
													aria-label={`Editar cliente ${client.name}`}
												>
													<Pencil className='h-4 w-4' />
												</Button>
												</div>
											</Card>
										))}
									</div>

									{/* Paginação */}
									{totalPages > 1 && (
										<div className='mt-4 flex items-center justify-center gap-4'>
											<Button
												variant='outline'
												size='sm'
												disabled={page <= 1}
												className='min-h-[44px] min-w-[44px]'
												aria-label='Página anterior'
											>
												<ChevronLeft className='h-4 w-4' />
											</Button>
											<span className='text-sm text-muted-foreground'>
												Página {page} de {totalPages}
											</span>
											<Button
												variant='outline'
												size='sm'
												disabled={page >= totalPages}
												className='min-h-[44px] min-w-[44px]'
												aria-label='Próxima página'
											>
												<ChevronRight className='h-4 w-4' />
											</Button>
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			<ClientFormDialog
				open={dialogOpen}
				onClose={handleDialogClose}
				onSuccess={handleSuccess}
				client={editingClient}
			/>
		</SidebarInset>
	)
}
