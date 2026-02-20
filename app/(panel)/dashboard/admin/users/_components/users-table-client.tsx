/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-22
 * @modified 2026-02-22
 * @version 2026.02.22
 * @projectVersion 0.9.0
 */
/**
 * Componente client para tabela de usuarios enterprise no painel admin.
 * Exibe lista de usuarios com nome, email, CPF, CNPJ, status do trial e
 * acoes: estender trial, editar CPF/CNPJ e resetar senha.
 *
 * @example
 * <UsersTableClient initialUsers={users} initialTotal={total} />
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
import { Badge } from '@/components/ui/badge'
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
import { CalendarPlus, KeyRound, Pencil, Users } from 'lucide-react'
import { toast } from 'sonner'
import { extendTrial } from '../_actions/extend-trial'
import { updateUserDocuments } from '../_actions/update-user-documents'
import { resetUserPassword } from '../_actions/reset-user-password'
import type { EnterpriseUserItem } from '../_data-access/get-enterprise-users'
import { formatCPF, maskCPF } from '@/utils/formatCPF'
import { formatCNPJ, maskCNPJ } from '@/utils/formatCNPJ'

/** Props do componente UsersTableClient */
interface UsersTableClientProps {
	/** Lista inicial de usuarios enterprise */
	initialUsers: EnterpriseUserItem[]
	/** Total de usuarios enterprise */
	initialTotal: number
}

const isTrialExpired = (trialEndsAt: Date | null): boolean => {
	if (!trialEndsAt) return true
	return new Date(trialEndsAt).getTime() <= Date.now()
}

const getDaysRemaining = (trialEndsAt: Date | null): number => {
	if (!trialEndsAt) return -1
	const diff = new Date(trialEndsAt).getTime() - Date.now()
	return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Tabela de usuarios enterprise com acoes administrativas completas.
 *
 * @param props - initialUsers e initialTotal
 * @returns JSX.Element
 */
export const UsersTableClient = ({
	initialUsers,
	initialTotal,
}: UsersTableClientProps) => {
	const router = useRouter()
	const [loadingAction, setLoadingAction] = useState<string | null>(null)

	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editUser, setEditUser] = useState<EnterpriseUserItem | null>(null)
	const [editCpf, setEditCpf] = useState('')
	const [editCnpj, setEditCnpj] = useState('')
	const [cpfError, setCpfError] = useState('')
	const [cnpjError, setCnpjError] = useState('')

	const [resetDialogOpen, setResetDialogOpen] = useState(false)
	const [resetUser, setResetUser] = useState<EnterpriseUserItem | null>(null)

	const handleOpenEdit = (user: EnterpriseUserItem): void => {
		setEditUser(user)
		setEditCpf(user.cpf ? maskCPF(user.cpf) : '')
		setEditCnpj(user.cnpj ? maskCNPJ(user.cnpj) : '')
		setCpfError('')
		setCnpjError('')
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

	const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const result = formatCNPJ(e.target.value)
		setEditCnpj(result.formatted)
		if (e.target.value.replace(/\D/g, '').length === 14) {
			setCnpjError(result.isValid ? '' : 'CNPJ inválido')
		} else {
			setCnpjError('')
		}
	}

	const handleSaveDocuments = async (): Promise<void> => {
		if (!editUser) return
		setLoadingAction(`edit-${editUser.id}`)
		try {
			const result = await updateUserDocuments({
				userId: editUser.id,
				cpf: editCpf || undefined,
				cnpj: editCnpj || undefined,
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

	const handleExtendTrial = async (userId: string): Promise<void> => {
		setLoadingAction(`trial-${userId}`)
		try {
			const result = await extendTrial(userId)
			if (result.success) {
				toast.success(result.message)
				router.refresh()
			} else {
				toast.error(result.error || 'Erro ao estender trial.')
			}
		} catch {
			toast.error('Erro inesperado.')
		} finally {
			setLoadingAction(null)
		}
	}

	const handleOpenReset = (user: EnterpriseUserItem): void => {
		setResetUser(user)
		setResetDialogOpen(true)
	}

	const handleConfirmReset = async (): Promise<void> => {
		if (!resetUser) return
		setLoadingAction(`reset-${resetUser.id}`)
		try {
			const result = await resetUserPassword(resetUser.id)
			if (result.success) {
				toast.success(result.message)
				setResetDialogOpen(false)
			} else {
				toast.error(result.error || 'Erro ao resetar senha.')
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
						<Users className='h-5 w-5' />
						<div>
							<CardTitle className='text-lg sm:text-xl'>Usuários Enterprise</CardTitle>
							<CardDescription>{initialTotal} usuário(s) cadastrado(s)</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{/* Desktop */}
					<div className='hidden sm:block'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nome</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>CPF</TableHead>
									<TableHead>Trial</TableHead>
									<TableHead className='text-right'>Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{initialUsers.map((user) => {
									const expired = isTrialExpired(user.trialEndsAt)
									const days = getDaysRemaining(user.trialEndsAt)

									return (
										<TableRow key={user.id}>
											<TableCell className='font-medium'>
												{user.name || '—'}
											</TableCell>
											<TableCell>{user.email}</TableCell>
											<TableCell>{user.cpf ? maskCPF(user.cpf) : '—'}</TableCell>
											<TableCell>
												{expired ? (
													<Badge variant='destructive'>Expirado</Badge>
												) : (
													<Badge variant='outline'>
														{days} dia{days !== 1 ? 's' : ''}
													</Badge>
												)}
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-1'>
													<Button
														variant='outline'
														size='sm'
														className='gap-1 min-h-[36px]'
														onClick={() => handleOpenEdit(user)}
														aria-label={`Editar documentos de ${user.name || user.email}`}
													>
														<Pencil className='h-3.5 w-3.5' />
														Editar
													</Button>
													<Button
														variant='outline'
														size='sm'
														className='gap-1 min-h-[36px]'
														onClick={() => handleOpenReset(user)}
														aria-label={`Resetar senha de ${user.name || user.email}`}
													>
														<KeyRound className='h-3.5 w-3.5' />
														Senha
													</Button>
													<Button
														variant='outline'
														size='sm'
														className='gap-1 min-h-[36px]'
														onClick={() => handleExtendTrial(user.id)}
														disabled={loadingAction === `trial-${user.id}`}
														aria-label={`Estender trial de ${user.name || user.email}`}
													>
														<CalendarPlus className='h-3.5 w-3.5' />
														{loadingAction === `trial-${user.id}` ? '...' : '+30d'}
													</Button>
												</div>
											</TableCell>
										</TableRow>
									)
								})}
								{initialUsers.length === 0 && (
									<TableRow>
										<TableCell colSpan={5} className='text-center text-muted-foreground py-8'>
											Nenhum usuário enterprise cadastrado.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Mobile */}
					<div className='sm:hidden space-y-3'>
						{initialUsers.map((user) => {
							const expired = isTrialExpired(user.trialEndsAt)
							const days = getDaysRemaining(user.trialEndsAt)

							return (
								<div key={user.id} className='border rounded-lg p-3 space-y-2'>
									<div className='flex items-center justify-between'>
										<span className='font-medium text-sm truncate'>
											{user.name || '—'}
										</span>
										{expired ? (
											<Badge variant='destructive'>Expirado</Badge>
										) : (
											<Badge variant='outline'>{days}d</Badge>
										)}
									</div>
									<p className='text-xs text-muted-foreground truncate'>{user.email}</p>
									{user.cpf && (
										<p className='text-xs text-muted-foreground'>CPF: {maskCPF(user.cpf)}</p>
									)}
									<div className='grid grid-cols-3 gap-1'>
										<Button
											variant='outline'
											size='sm'
											className='min-h-[44px] gap-1'
											onClick={() => handleOpenEdit(user)}
											aria-label={`Editar documentos de ${user.name || user.email}`}
										>
											<Pencil className='h-3.5 w-3.5' />
											Editar
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='min-h-[44px] gap-1'
											onClick={() => handleOpenReset(user)}
											aria-label={`Resetar senha de ${user.name || user.email}`}
										>
											<KeyRound className='h-3.5 w-3.5' />
											Senha
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='min-h-[44px] gap-1'
											onClick={() => handleExtendTrial(user.id)}
											disabled={loadingAction === `trial-${user.id}`}
											aria-label={`Estender trial de ${user.name || user.email}`}
										>
											<CalendarPlus className='h-3.5 w-3.5' />
											+30d
										</Button>
									</div>
								</div>
							)
						})}
						{initialUsers.length === 0 && (
							<p className='text-center text-muted-foreground py-8'>
								Nenhum usuário enterprise cadastrado.
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Dialog: Editar CPF/CNPJ */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Editar Documentos</DialogTitle>
						<DialogDescription>
							Alterar CPF e CNPJ de {editUser?.name || editUser?.email}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='edit-cpf'>CPF</Label>
							<Input
								id='edit-cpf'
								value={editCpf}
								onChange={handleCpfChange}
								placeholder='000.000.000-00'
								maxLength={14}
								aria-label='CPF do usuário'
							/>
							{cpfError && <p className='text-xs text-destructive'>{cpfError}</p>}
						</div>
						<div className='space-y-2'>
							<Label htmlFor='edit-cnpj'>CNPJ</Label>
							<Input
								id='edit-cnpj'
								value={editCnpj}
								onChange={handleCnpjChange}
								placeholder='00.000.000/0000-00'
								maxLength={18}
								aria-label='CNPJ do usuário'
							/>
							{cnpjError && <p className='text-xs text-destructive'>{cnpjError}</p>}
						</div>
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
							onClick={handleSaveDocuments}
							disabled={loadingAction?.startsWith('edit-') || !!cpfError || !!cnpjError}
							className='min-h-[44px]'
						>
							{loadingAction?.startsWith('edit-') ? 'Salvando...' : 'Salvar'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Resetar Senha */}
			<Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
				<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Resetar Senha</DialogTitle>
						<DialogDescription>
							Um link de redefinição de senha será enviado para{' '}
							<strong>{resetUser?.email}</strong>
						</DialogDescription>
					</DialogHeader>
					<p className='text-sm text-muted-foreground'>
						O usuário receberá um email com um link válido por 15 minutos
						para criar uma nova senha.
					</p>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setResetDialogOpen(false)}
							className='min-h-[44px]'
						>
							Cancelar
						</Button>
						<Button
							onClick={handleConfirmReset}
							disabled={loadingAction?.startsWith('reset-')}
							className='min-h-[44px]'
						>
							{loadingAction?.startsWith('reset-') ? 'Enviando...' : 'Enviar Link de Reset'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
