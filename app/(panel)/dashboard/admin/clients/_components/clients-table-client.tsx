/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Componente client para tabela global de clientes no painel admin.
 * Exibe todos os clientes de todos os usuarios enterprise com busca,
 * paginacao e opcao de editar CPF. Exclusivo para usuarios master.
 *
 * @example
 * <ClientsTableClient initialClients={clients} initialTotal={total} />
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, Search, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { updateClientCpf } from '../_actions/update-client-cpf'
import type { AdminClientItem } from '../_data-access/get-all-clients'
import { formatCPF, maskCPF } from '@/utils/formatCPF'

/** Props do componente ClientsTableClient */
interface ClientsTableClientProps {
	/** Lista inicial de clientes */
	initialClients: AdminClientItem[]
	/** Total de clientes */
	initialTotal: number
}

/**
 * Tabela global de clientes com busca local e dialog para edicao de CPF.
 *
 * @param props - initialClients e initialTotal
 * @returns JSX.Element
 */
export const ClientsTableClient = ({
	initialClients,
	initialTotal,
}: ClientsTableClientProps) => {
	const router = useRouter()
	const [loadingAction, setLoadingAction] = useState<string | null>(null)
	const [searchTerm, setSearchTerm] = useState('')

	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editClient, setEditClient] = useState<AdminClientItem | null>(null)
	const [editCpf, setEditCpf] = useState('')
	const [cpfError, setCpfError] = useState('')

	const filteredClients = searchTerm
		? initialClients.filter((c) => {
			const term = searchTerm.toLowerCase()
			return (
				c.name.toLowerCase().includes(term) ||
				c.email.toLowerCase().includes(term) ||
				c.cpf.includes(searchTerm.replace(/\D/g, ''))
			)
		})
		: initialClients

	const handleOpenEdit = (client: AdminClientItem): void => {
		setEditClient(client)
		setEditCpf(maskCPF(client.cpf))
		setCpfError('')
		setEditDialogOpen(true)
	}

	const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const result = formatCPF(e.target.value)
		setEditCpf(result.formatted)
		if (e.target.value.replace(/\D/g, '').length === 11) {
			setCpfError(result.isValid ? '' : 'CPF inválido')
		} else {
			setCpfError('')
		}
	}

	const handleSaveCpf = async (): Promise<void> => {
		if (!editClient) return
		setLoadingAction(`edit-${editClient.id}`)
		try {
			const result = await updateClientCpf({
				clientId: editClient.id,
				cpf: editCpf,
			})
			if (result.success) {
				toast.success(result.message)
				setEditDialogOpen(false)
				router.refresh()
			} else {
				toast.error(result.error || 'Erro ao salvar.')
			}
		} catch {
			toast.error('Erro inesperado.')
		} finally {
			setLoadingAction(null)
		}
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className='flex items-center gap-2'>
						<UsersRound className='h-5 w-5' />
						<div>
							<CardTitle className='text-lg sm:text-xl'>Clientes</CardTitle>
							<CardDescription>{initialTotal} cliente(s) cadastrado(s)</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
						<Input
							placeholder='Buscar por nome, email ou CPF...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-9 min-h-[44px]'
							aria-label='Buscar clientes'
						/>
					</div>

					{/* Desktop */}
					<div className='hidden sm:block'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nome</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Telefone</TableHead>
									<TableHead>CPF</TableHead>
									<TableHead>Proprietário</TableHead>
									<TableHead className='text-right'>Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredClients.map((client) => (
									<TableRow key={client.id}>
										<TableCell className='font-medium'>{client.name}</TableCell>
										<TableCell>{client.email}</TableCell>
										<TableCell>{client.phone}</TableCell>
										<TableCell>{maskCPF(client.cpf)}</TableCell>
										<TableCell className='text-muted-foreground'>
											{client.ownerName || client.ownerEmail}
										</TableCell>
										<TableCell className='text-right'>
											<Button
												variant='outline'
												size='sm'
												className='gap-1 min-h-[36px]'
												onClick={() => handleOpenEdit(client)}
												aria-label={`Editar CPF de ${client.name}`}
											>
												<Pencil className='h-3.5 w-3.5' />
												Editar CPF
											</Button>
										</TableCell>
									</TableRow>
								))}
								{filteredClients.length === 0 && (
									<TableRow>
										<TableCell colSpan={6} className='text-center text-muted-foreground py-8'>
											{searchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Mobile */}
					<div className='sm:hidden space-y-3'>
						{filteredClients.map((client) => (
							<div key={client.id} className='border rounded-lg p-3 space-y-2'>
								<div className='flex items-center justify-between'>
									<span className='font-medium text-sm truncate'>{client.name}</span>
								</div>
								<p className='text-xs text-muted-foreground truncate'>{client.email}</p>
								<p className='text-xs text-muted-foreground'>{client.phone}</p>
								<p className='text-xs text-muted-foreground'>CPF: {maskCPF(client.cpf)}</p>
								<p className='text-xs text-muted-foreground'>
									Prop: {client.ownerName || client.ownerEmail}
								</p>
								<Button
									variant='outline'
									size='sm'
									className='w-full min-h-[44px] gap-1'
									onClick={() => handleOpenEdit(client)}
									aria-label={`Editar CPF de ${client.name}`}
								>
									<Pencil className='h-3.5 w-3.5' />
									Editar CPF
								</Button>
							</div>
						))}
						{filteredClients.length === 0 && (
							<p className='text-center text-muted-foreground py-8'>
								{searchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Dialog: Editar CPF */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Editar CPF do Cliente</DialogTitle>
						<DialogDescription>
							Alterar CPF de {editClient?.name}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-2'>
						<Label htmlFor='edit-client-cpf'>CPF</Label>
						<Input
							id='edit-client-cpf'
							value={editCpf}
							onChange={handleCpfChange}
							placeholder='000.000.000-00'
							maxLength={14}
							aria-label='CPF do cliente'
						/>
						{cpfError && <p className='text-xs text-destructive'>{cpfError}</p>}
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setEditDialogOpen(false)}
							className='min-h-[44px]'
						>
							Cancelar
						</Button>
						<Button
							onClick={handleSaveCpf}
							disabled={loadingAction?.startsWith('edit-') || !!cpfError}
							className='min-h-[44px]'
						>
							{loadingAction?.startsWith('edit-') ? 'Salvando...' : 'Salvar'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
