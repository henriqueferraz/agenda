/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Lista de feriados cadastrados em card. Exibe data formatada (fuso São Paulo),
 * motivo e botões de editar/deletar. Confirma exclusão via AlertDialog e chama
 * deleteStopDay. Estado vazio exibe mensagem quando não há feriados.
 *
 * @example
 * ```tsx
 * <ListStopDays userId={userId} stopDays={stopDays} onEdit={handleEdit} onRefresh={loadStopDays} />
 * ```
 */
'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react'
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
import { deleteStopDay } from '../_actions/delete-stopday'
import { formatDateInSaoPaulo } from '@/utils/date-timezone'
interface StopDay {
	id: string
	date: Date
	motivation: string
	createdAt: Date
	updatedAt: Date
}
interface ListStopDaysProps {
	userId: string
	stopDays: StopDay[]
	onEdit: (stopDay: StopDay) => void
	onRefresh: () => void
}
export const ListStopDays = ({
	userId,
	stopDays,
	onEdit,
	onRefresh,
}: ListStopDaysProps) => {
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [stopDayToDelete, setStopDayToDelete] = useState<StopDay | null>(null)
	const handleDeleteClick = (stopDay: StopDay) => {
		setStopDayToDelete(stopDay)
		setShowDeleteDialog(true)
	}
	const handleDeleteConfirm = async () => {
		if (!stopDayToDelete) return
		setDeletingId(stopDayToDelete.id)
		setShowDeleteDialog(false)
		try {
			const result = await deleteStopDay({
				id: stopDayToDelete.id,
				userId,
			})
			if (result.success) {
				toast.success(result.message || 'Feriado deletado com sucesso!')
				onRefresh()
			} else {
				toast.error(result.error || 'Erro ao deletar feriado')
			}
		} catch (error) {
			console.error('Erro ao deletar feriado:', error)
			toast.error('Erro inesperado ao deletar feriado')
		} finally {
			setDeletingId(null)
			setStopDayToDelete(null)
		}
	}
	if (stopDays.length === 0) {
		return (
			<Card>
				<CardContent className='pt-6'>
					<div className='text-center py-8 text-muted-foreground'>
						<Calendar className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>Nenhum feriado cadastrado</p>
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
						<Calendar className='h-5 w-5' />
						Feriados Cadastrados
					</CardTitle>
					<CardDescription>
						Lista de dias em que a empresa não funcionará
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{stopDays.map((stopDay) => {
							const isPast = new Date(stopDay.date) < new Date()
							const formattedDate = formatDateInSaoPaulo(
								new Date(stopDay.date),
								{
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								},
							)
							return (
								<div
									key={stopDay.id}
									className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors'
								>
									<div className='flex-1'>
										<div className='flex items-center gap-2 mb-1'>
											<Calendar className='h-4 w-4 text-muted-foreground' />
											<span className='font-medium'>{formattedDate}</span>
											{isPast && (
												<span className='text-xs text-muted-foreground'>
													(Passado)
												</span>
											)}
										</div>
										<p className='text-sm text-muted-foreground ml-6'>
											{stopDay.motivation}
										</p>
									</div>
									<div className='flex gap-2 ml-4'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => onEdit(stopDay)}
										disabled={deletingId === stopDay.id}
										className='min-h-[44px] min-w-[44px]'
									>
										<Edit2 className='h-4 w-4' />
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => handleDeleteClick(stopDay)}
										disabled={deletingId === stopDay.id}
										className='min-h-[44px] min-w-[44px]'
									>
											{deletingId === stopDay.id ? (
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
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<AlertCircle className='h-5 w-5 text-destructive' />
							Confirmar exclusão
						</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja deletar o feriado de{' '}
							<strong>
								{stopDayToDelete
									? formatDateInSaoPaulo(new Date(stopDayToDelete.date), {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})
									: ''}
							</strong>
							?
							<br />
							<br />
							Motivo: {stopDayToDelete?.motivation}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Deletar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
