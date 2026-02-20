/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-21
 * @version 2026.02.21
 * @projectVersion 0.9.0
 */
/**
 * Dialog responsivo para criar ou editar um cliente. Inclui campo CPF com validação
 * algorítmica e máscara automática. Em modo edição, oferece toggle para propagar alterações.
 *
 * @example
 * ```tsx
 * <ClientFormDialog open={true} onClose={close} onSuccess={refresh} client={null} />
 * ```
 */
'use client'
import { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '../_actions/create-client'
import { updateClient } from '../_actions/update-client'
import { formatCPF, maskCPF } from '@/utils/formatCPF'

/** Tipo simplificado do cliente para o dialog */
interface ClientData {
	id: string
	name: string
	email: string
	phone: string
	cpf: string
	notes: string | null
}

/** Props do dialog */
interface ClientFormDialogProps {
	/** Se o dialog está aberto */
	open: boolean
	/** Callback ao fechar */
	onClose: () => void
	/** Callback ao salvar com sucesso */
	onSuccess: () => void
	/** Cliente para edição (null = criação) */
	client: ClientData | null
}

/**
 * Dialog para criar ou editar cliente com validação de CPF algorítmica.
 *
 * @param props - Estado do dialog e callbacks
 * @returns JSX.Element
 */
export const ClientFormDialog = ({
	open,
	onClose,
	onSuccess,
	client,
}: ClientFormDialogProps) => {
	const isEditing = !!client
	const [loading, setLoading] = useState(false)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [cpf, setCpf] = useState('')
	const [cpfError, setCpfError] = useState('')
	const [notes, setNotes] = useState('')


	useEffect(() => {
		if (client) {
			setName(client.name)
			setEmail(client.email)
			setPhone(client.phone)
			setCpf(maskCPF(client.cpf))
			setCpfError('')
			setNotes(client.notes || '')
		} else {
			setName('')
			setEmail('')
			setPhone('')
			setCpf('')
			setCpfError('')
			setNotes('')
		}
	}, [client, open])

	const handleCpfChange = (rawValue: string) => {
		const digits = rawValue.replace(/\D/g, '').slice(0, 11)

		if (digits.length <= 11) {
			const { formatted, isValid } = formatCPF(digits)
			setCpf(digits.length === 11 ? formatted : digits)

			if (digits.length === 11 && !isValid) {
				setCpfError('CPF inválido')
			} else {
				setCpfError('')
			}
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			if (isEditing && client) {
				const result = await updateClient({
					id: client.id,
					name,
					email,
					phone,
					cpf,
					notes: notes || undefined,
				})
				if (result.success) {
					toast.success(result.message)
					onSuccess()
				} else {
					toast.error(result.error)
				}
			} else {
				const result = await createClient({
					name,
					email,
					phone,
					cpf,
					notes: notes || undefined,
				})
				if (result.success) {
					toast.success(result.message)
					onSuccess()
				} else {
					toast.error(result.error)
				}
			}
		} catch {
			toast.error('Erro inesperado. Tente novamente.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
			<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
					<DialogDescription>
						{isEditing
							? 'Altere as informações do cliente abaixo.'
							: 'Preencha os dados para cadastrar um novo cliente.'}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='client-cpf'>CPF *</Label>
						<Input
							id='client-cpf'
							value={cpf}
							onChange={(e) => handleCpfChange(e.target.value)}
							placeholder='000.000.000-00'
							required
							className='min-h-[44px]'
							aria-label='CPF do cliente'
						/>
						{cpfError && (
							<p className='text-sm text-destructive'>{cpfError}</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='client-name'>Nome *</Label>
						<Input
							id='client-name'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Nome completo do cliente'
							required
							minLength={2}
							maxLength={100}
							className='min-h-[44px]'
							aria-label='Nome do cliente'
						/>
					</div>

					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
						<div className='space-y-2'>
							<Label htmlFor='client-email'>Email *</Label>
							<Input
								id='client-email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='email@exemplo.com'
								required
								maxLength={150}
								className='min-h-[44px]'
								aria-label='Email do cliente'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='client-phone'>Telefone *</Label>
							<Input
								id='client-phone'
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder='47999998888'
								required
								minLength={10}
								maxLength={15}
								className='min-h-[44px]'
								aria-label='Telefone do cliente'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='client-notes'>Observações (opcional)</Label>
						<Textarea
							id='client-notes'
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder='Anotações sobre o cliente...'
							maxLength={500}
							rows={3}
							aria-label='Observações sobre o cliente'
						/>
					</div>

					<div className='flex justify-end gap-2 pt-2'>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={loading}
							className='min-h-[44px]'
							aria-label='Cancelar'
						>
							Cancelar
						</Button>
						<Button
							type='submit'
							disabled={loading || !!cpfError}
							className='min-h-[44px]'
							aria-label={isEditing ? 'Salvar alterações' : 'Cadastrar cliente'}
						>
							{loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							{isEditing ? 'Salvar' : 'Cadastrar'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
