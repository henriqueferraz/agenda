/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Lista de bloqueios de horário cadastrados. Exibe data formatada (fuso São Paulo),
 * funcionário, horário, motivo e botão de exclusão com confirmação via AlertDialog.
 * Indica visualmente bloqueios que já passaram.
 *
 * @example
 * ```tsx
 * <ListBlockedTimes userId={userId} blockedTimes={blockedTimes} onRefresh={loadData} />
 * ```
 */
'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Clock, Trash2, AlertCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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
import { deleteBlockedTime } from '../_actions/delete-blocked-time'
import { formatDateInSaoPaulo } from '@/utils/date-timezone'
import { BlockedTimeWithEmployee } from '../_data-access/get-all-blocked-times'

/** Props do componente de lista de bloqueios */
interface ListBlockedTimesProps {
	/** ID do usuário (empresa) */
	userId: string
	/** Array de bloqueios com dados do funcionário */
	blockedTimes: BlockedTimeWithEmployee[]
	/** Callback para recarregar dados após exclusão */
	onRefresh: () => void
}

/**
 * Renderiza lista de bloqueios de horário com opção de exclusão.
 * Exibe estado vazio quando não há bloqueios cadastrados.
 *
 * @param props - userId, blockedTimes, onRefresh
 * @returns React.JSX.Element
 *
 * @example
 * ```tsx
 * <ListBlockedTimes userId="usr_123" blockedTimes={data} onRefresh={reload} />
 * ```
 */
export const ListBlockedTimes = ({
	userId,
	blockedTimes,
	onRefresh,
}: ListBlockedTimesProps) => {
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [blockToDelete, setBlockToDelete] = useState<BlockedTimeWithEmployee | null>(null)

	const handleDeleteClick = (block: BlockedTimeWithEmployee) => {
		setBlockToDelete(block)
		setShowDeleteDialog(true)
	}

	const handleDeleteConfirm = async () => {
		if (!blockToDelete) return
		setDeletingId(blockToDelete.id)
		setShowDeleteDialog(false)
		try {
			const result = await deleteBlockedTime({
				id: blockToDelete.id,
				userId,
			})
			if (result.success) {
				toast.success(result.message || 'Bloqueio removido com sucesso!')
				onRefresh()
			} else {
				toast.error(result.error || 'Erro ao remover bloqueio')
			}
		} catch (error) {
			console.error('Erro ao deletar bloqueio:', error)
			toast.error('Erro inesperado ao deletar bloqueio')
		} finally {
			setDeletingId(null)
			setBlockToDelete(null)
		}
	}

	if (blockedTimes.length === 0) {
		return (
			<Card>
				<CardContent className='pt-6'>
					<div className='text-center py-8 text-muted-foreground'>
						<Clock className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>Nenhum bloqueio de horário cadastrado</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Clock className='h-5 w-5' />
						Bloqueios Cadastrados
					</CardTitle>
					<CardDescription>
						Horários bloqueados que impedem agendamentos
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{blockedTimes.map((block) => {
							const isPast = new Date(block.date) < new Date()
							const formattedDate = formatDateInSaoPaulo(
								new Date(block.date),
								{
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								},
							)

							return (
								<div
									key={block.id}
									className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors'
								>
									<div className='flex-1'>
										<div className='flex items-center gap-2 mb-1'>
											<Clock className='h-4 w-4 text-muted-foreground' />
											<span className='font-medium'>{formattedDate}</span>
											<span className='text-sm font-semibold text-primary'>
												{block.time}
											</span>
											{isPast && (
												<span className='text-xs text-muted-foreground'>
													(Passado)
												</span>
											)}
										</div>
										<div className='flex items-center gap-2 ml-6 mb-1'>
											<User className='h-3 w-3 text-muted-foreground' />
											<span className='text-sm text-muted-foreground'>
												{block.employee.name}
											</span>
										</div>
										<p className='text-sm text-muted-foreground ml-6'>
											{block.motivation}
										</p>
									</div>
									<div className='flex gap-2 ml-4'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleDeleteClick(block)}
											disabled={deletingId === block.id}
											className='min-h-[44px] min-w-[44px]'
											aria-label={`Remover bloqueio de ${block.employee.name} em ${formattedDate} às ${block.time}`}
										>
											{deletingId === block.id ? (
												<Loader2 className='h-4 w-4 animate-spin' />
											) : (
												<Trash2 className='h-4 w-4' />
											)}
										</Button>
									</div>
								</div>
							)
						})}
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-lg'>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<AlertCircle className='h-5 w-5 text-destructive' />
							Confirmar exclusão
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja remover o bloqueio de{' '}
							<strong>{blockToDelete?.employee.name}</strong> no dia{' '}
							<strong>
								{blockToDelete
									? formatDateInSaoPaulo(new Date(blockToDelete.date), {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})
									: ''}
							</strong>{' '}
							às <strong>{blockToDelete?.time}</strong>?
							<br />
							<br />
							Motivo: {blockToDelete?.motivation}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Remover
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
