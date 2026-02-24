/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Componente de upload de logo da empresa com preview, validacao client-side
 * (PNG/JPG, max 1 MB), upload via fetch POST e remocao via fetch DELETE.
 * Posicionado acima das abas PF/PJ na pagina de configuracao do modelo.
 *
 * @example
 * ```tsx
 * <LogoUpload currentLogo={user.logo} />
 * ```
 */
'use client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImagePlus, Trash2, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useRef, useState } from 'react'
import { toast } from 'sonner'

/** Tipos MIME aceitos no input file */
const ACCEPTED_TYPES = 'image/png,image/jpeg'

/** Tamanho maximo do arquivo em bytes (1 MB) */
const MAX_FILE_SIZE = 1_048_576
const shouldDisableImageOptimization = (value: string | null): boolean => {
	if (typeof value !== 'string' || value.length === 0) {
		return false
	}
	return !value.startsWith('/')
}

/** Props do componente LogoUpload. */
interface LogoUploadProps {
	/** URL relativa do logo atual (null se nenhum logo definido). */
	currentLogo: string | null
}

/**
 * Componente de upload de logo da empresa.
 * Exibe o logo atual ou placeholder, permite selecionar arquivo com preview
 * e envia para /api/upload/logo. Tambem permite remover o logo existente.
 *
 * @param props - currentLogo com URL do logo (local, remota ou data URL) ou null
 * @returns JSX com area de upload, preview e botoes de acao
 */
export const LogoUpload = ({ currentLogo }: LogoUploadProps): React.JSX.Element => {
	const router = useRouter()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [preview, setPreview] = useState<string | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [isRemoving, setIsRemoving] = useState(false)

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!['image/png', 'image/jpeg'].includes(file.type)) {
			toast.error('Formato inválido. Envie apenas PNG ou JPG.')
			resetInput()
			return
		}

		if (file.size > MAX_FILE_SIZE) {
			toast.error('Arquivo muito grande. Tamanho máximo: 1 MB.')
			resetInput()
			return
		}

		setSelectedFile(file)
		const objectUrl = URL.createObjectURL(file)
		setPreview(objectUrl)
	}

	const resetInput = (): void => {
		setSelectedFile(null)
		setPreview(null)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleUpload = async (): Promise<void> => {
		if (!selectedFile) return

		setIsUploading(true)
		try {
			const formData = new FormData()
			formData.append('file', selectedFile)

			const response = await fetch('/api/upload/logo', {
				method: 'POST',
				body: formData,
			})

			const data = await response.json()

			if (!response.ok) {
				toast.error(data.error || 'Erro ao enviar logo.')
				return
			}

			toast.success('Logo atualizado com sucesso.')
			resetInput()
			router.refresh()
		} catch {
			toast.error('Erro inesperado ao enviar logo.')
		} finally {
			setIsUploading(false)
		}
	}

	const handleRemove = async (): Promise<void> => {
		setIsRemoving(true)
		try {
			const response = await fetch('/api/upload/logo', {
				method: 'DELETE',
			})

			const data = await response.json()

			if (!response.ok) {
				toast.error(data.error || 'Erro ao remover logo.')
				return
			}

			toast.success('Logo removido com sucesso.')
			resetInput()
			router.refresh()
		} catch {
			toast.error('Erro inesperado ao remover logo.')
		} finally {
			setIsRemoving(false)
		}
	}

	const displayImage = preview || currentLogo

	return (
		<div className='space-y-3'>
			<Label className='font-semibold'>Logo da Empresa</Label>

			<div className='flex flex-col items-center gap-4 sm:flex-row'>
				{/* Area de preview / placeholder */}
				<div className='flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50'>
					{displayImage ? (
						<Image
							src={displayImage}
							alt='Logo da empresa'
							width={96}
							height={96}
							className='h-full w-full object-contain'
							unoptimized={!!preview || shouldDisableImageOptimization(displayImage)}
						/>
					) : (
						<ImagePlus className='h-8 w-8 text-muted-foreground/50' />
					)}
				</div>

				{/* Controles */}
				<div className='flex flex-col gap-2'>
					<input
						ref={fileInputRef}
						type='file'
						accept={ACCEPTED_TYPES}
						onChange={handleFileSelect}
						className='hidden'
						aria-label='Selecionar logo da empresa'
					/>

					<div className='flex flex-wrap gap-2'>
						{!selectedFile && (
							<Button
								type='button'
								variant='outline'
								size='sm'
								className='min-h-[44px]'
								onClick={() => fileInputRef.current?.click()}
								aria-label='Selecionar imagem do logo'
							>
								<ImagePlus className='mr-2 h-4 w-4' />
								Selecionar
							</Button>
						)}

						{selectedFile && (
							<>
								<Button
									type='button'
									variant='default'
									size='sm'
									className='min-h-[44px]'
									onClick={handleUpload}
									disabled={isUploading}
									aria-label='Enviar logo da empresa'
								>
									{isUploading ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : (
										<Upload className='mr-2 h-4 w-4' />
									)}
									{isUploading ? 'Enviando...' : 'Enviar'}
								</Button>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									className='min-h-[44px]'
									onClick={resetInput}
									disabled={isUploading}
									aria-label='Cancelar seleção do logo'
								>
									Cancelar
								</Button>
							</>
						)}

						{currentLogo && !selectedFile && (
							<Button
								type='button'
								variant='destructive'
								size='sm'
								className='min-h-[44px]'
								onClick={handleRemove}
								disabled={isRemoving}
								aria-label='Remover logo da empresa'
							>
								{isRemoving ? (
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								) : (
									<Trash2 className='mr-2 h-4 w-4' />
								)}
								{isRemoving ? 'Removendo...' : 'Remover'}
							</Button>
						)}
					</div>

					<p className='text-xs text-muted-foreground'>
						PNG ou JPG. Tamanho máximo: 1 MB.
					</p>
				</div>
			</div>
		</div>
	)
}
