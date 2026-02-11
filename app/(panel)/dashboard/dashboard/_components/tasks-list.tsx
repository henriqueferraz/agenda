/**
 * Componente TasksList - Lista de tarefas/lembretes do dashboard
 *
 * Exibe, cria, edita e deleta lembretes do usuario via server actions.
 * Usa modal com formulario e AlertDialog para confirmacao de exclusao.
 *
 * @example
 * <TasksList reminders={reminders} userId={userId} />
 */
'use client'
/**
 *  Componente de Lista de Tarefas
 *
 * Componente que exibe uma lista de tarefas (lembretes) do usuário,
 * permitindo criar, editar e deletar tarefas. As tarefas são ordenadas
 * por data de criação, com as mais antigas primeiro.
 *
 * ## Funcionalidades
 * -  Lista de tarefas ordenadas por data de criação
 * -  Botão para criar nova tarefa
 * -  Botões de editar e deletar em cada linha
 * -  Modal para criar/editar tarefas
 * -  Validação de formulário
 * -  Atualização automática após operações
 * -  Tratamento de erros e feedback visual
 *
 * ## Estrutura da Interface
 * ```
 * ┌─ Tarefas ─────────────────────────────┐
 * │ [Botão: Nova Tarefa]                    │
 * │                                         │
 * │ ┌─ Tarefa 1 ─────────────────────────┐ │
 * │ │ Descrição da tarefa [Editar] [X]  │ │
 * │ └────────────────────────────────────┘ │
 * │                                         │
 * │ ┌─ Tarefa 2 ─────────────────────────┐ │
 * │ │ Descrição da tarefa [Editar] [X]  │ │
 * │ └────────────────────────────────────┘ │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Dependências Externas
 * - `getReminders`: Busca lista de tarefas
 * - `createReminder`: Cria nova tarefa
 * - `updateReminder`: Atualiza tarefa existente
 * - `deleteReminder`: Deleta tarefa
 * - Componentes UI: Card, Button, Dialog, Input, Label
 *
 * ## Estados do Componente
 * - **reminders**: Lista de tarefas
 * - **isLoading**: Estado de carregamento
 * - **isModalOpen**: Estado do modal de criar/editar
 * - **editingReminder**: Tarefa sendo editada (null se criando nova)
 * - **formDescription**: Descrição no formulário
 *
 * @param userId - ID do usuário (empresa)
 * @returns JSX.Element - Lista de tarefas renderizada
 *
 * @example
 * ```tsx
 * <TasksList userId="usr_123" />
 * ```
 */
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { getReminders, Reminder } from '../_data-access/get-reminders'
import { createReminder } from '../_actions/create-reminder'
import { updateReminder } from '../_actions/update-reminder'
import { deleteReminder } from '../_actions/delete-reminder'
import { toast } from 'sonner'
/** Props do componente TasksList. */
interface TasksListProps {
	/** ID do usuário (empresa) para carregar e persistir lembretes. */
	userId: string
}
export const TasksList = ({ userId }: TasksListProps) => {
	const [reminders, setReminders] = useState<Reminder[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
	const [formDescription, setFormDescription] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	// Carrega lista de tarefas
	const loadReminders = async () => {
		setIsLoading(true)
		try {
			const data = await getReminders({ userId })
			setReminders(data)
		} catch (error) {
			console.error('Erro ao carregar tarefas:', error)
			toast.error('Erro ao carregar tarefas')
		} finally {
			setIsLoading(false)
		}
	}
	// Carrega tarefas ao montar o componente
	useEffect(() => {
		loadReminders()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId])
	// Abre modal para criar nova tarefa
	const handleCreateNew = () => {
		setEditingReminder(null)
		setFormDescription('')
		setIsModalOpen(true)
	}
	// Abre modal para editar tarefa
	const handleEdit = (reminder: Reminder) => {
		setEditingReminder(reminder)
		setFormDescription(reminder.description)
		setIsModalOpen(true)
	}
	// Fecha modal e limpa formulário
	const handleCloseModal = () => {
		setIsModalOpen(false)
		setEditingReminder(null)
		setFormDescription('')
	}
	// Salva tarefa (criar ou editar)
	const handleSave = async () => {
		if (!formDescription.trim()) {
			toast.error('A descrição é obrigatória')
			return
		}
		setIsSubmitting(true)
		try {
			let result
			if (editingReminder) {
				// Atualiza tarefa existente
				result = await updateReminder({
					id: editingReminder.id,
					description: formDescription.trim(),
					userId,
				})
			} else {
				// Cria nova tarefa
				result = await createReminder({
					description: formDescription.trim(),
					userId,
				})
			}
			if (result.success) {
				toast.success(result.message)
				handleCloseModal()
				await loadReminders() // Recarrega lista
			} else {
				toast.error(result.message)
			}
		} catch (error) {
			console.error('Erro ao salvar tarefa:', error)
			toast.error('Erro ao salvar tarefa. Tente novamente.')
		} finally {
			setIsSubmitting(false)
		}
	}
	// Deleta tarefa
	const handleDelete = async (id: string) => {
		if (!confirm('Tem certeza que deseja deletar esta tarefa?')) {
			return
		}
		setDeletingId(id)
		try {
			const result = await deleteReminder({ id, userId })
			if (result.success) {
				toast.success(result.message)
				await loadReminders() // Recarrega lista
			} else {
				toast.error(result.message)
			}
		} catch (error) {
			console.error('Erro ao deletar tarefa:', error)
			toast.error('Erro ao deletar tarefa. Tente novamente.')
		} finally {
			setDeletingId(null)
		}
	}
	return (
		<Card>
			<CardHeader>
				<div className='flex items-center justify-between'>
					<CardTitle className='text-lg'>Tarefas</CardTitle>
					<Button onClick={handleCreateNew} size='sm' variant='outline'>
						<Plus className='h-4 w-4 mr-2' />
						Nova Tarefa
					</Button>
				</div>
			</CardHeader>
			<CardContent className='space-y-2 max-h-[500px] overflow-y-auto'>
				{isLoading ? (
					<div className='flex items-center justify-center py-8'>
						<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
						<span className='ml-2 text-sm text-muted-foreground'>
							Carregando tarefas...
						</span>
					</div>
				) : reminders.length === 0 ? (
					<div className='text-center py-8'>
						<p className='text-sm text-muted-foreground'>
							Nenhuma tarefa cadastrada.
						</p>
					</div>
				) : (
					<div className='space-y-2'>
						{reminders.map((reminder) => (
							<div
								key={reminder.id}
								className='flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors'
							>
								<p className='text-sm flex-1 pr-4'>{reminder.description}</p>
								<div className='flex items-center gap-2'>
									<Button
										onClick={() => handleEdit(reminder)}
										size='sm'
										variant='ghost'
										className='h-8 w-8 p-0'
									>
										<Pencil className='h-4 w-4' />
									</Button>
									<Button
										onClick={() => handleDelete(reminder.id)}
										size='sm'
										variant='ghost'
										className='h-8 w-8 p-0 text-destructive hover:text-destructive'
										disabled={deletingId === reminder.id}
									>
										{deletingId === reminder.id ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<Trash2 className='h-4 w-4' />
										)}
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			{/* Modal de Criar/Editar Tarefa */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingReminder ? 'Editar Tarefa' : 'Nova Tarefa'}
						</DialogTitle>
						<DialogDescription>
							{editingReminder
								? 'Edite a descrição da tarefa abaixo.'
								: 'Preencha a descrição da nova tarefa.'}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='description'>Descrição</Label>
							<Input
								id='description'
								value={formDescription}
								onChange={(e) => setFormDescription(e.target.value)}
								placeholder='Digite a descrição da tarefa...'
								maxLength={500}
								disabled={isSubmitting}
							/>
							<p className='text-xs text-muted-foreground'>
								{formDescription.length}/500 caracteres
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={handleCloseModal}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSubmitting || !formDescription.trim()}
						>
							{isSubmitting ? (
								<>
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
									Salvando...
								</>
							) : (
								<>
									<CheckCircle2 className='h-4 w-4 mr-2' />
									Salvar
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	)
}
