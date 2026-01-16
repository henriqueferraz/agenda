/**
 * Componente - Model Stopday
 *
 * Visao geral:
 * - Componente React para Model Stopday.
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
 * import * as modulo from "@/app/(panel)/dashboard/schedule/stopday/_components/model-stopday";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
import { useState, useEffect } from 'react'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { FormStopDay } from './form-stopday'
import { ListStopDays } from './list-stopdays'
import { getAllStopDays } from '../_data-access/get-all-stopdays'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface ModelStopDayProps {
	userId: string
}
interface StopDay {
	id: string
	date: Date
	motivation: string
	createdAt: Date
	updatedAt: Date
}
export const ModelStopDay = ({ userId }: ModelStopDayProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const [stopDays, setStopDays] = useState<StopDay[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [editingStopDay, setEditingStopDay] = useState<StopDay | null>(null)
	const loadStopDays = async () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setIsLoading(true)
		try {
			const data = await getAllStopDays({ userId })
			setStopDays(data)
		} catch (error) {
			console.error('Erro ao carregar feriados:', error)
		} finally {
			setIsLoading(false)
		}
	}
	useEffect(() => {
		loadStopDays()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId])
	const handleEdit = (stopDay: StopDay) => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEditingStopDay(stopDay)
	}
	const handleCancelEdit = () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEditingStopDay(null)
	}
	const handleSuccess = () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		setEditingStopDay(null)
		loadStopDays()
	}
	return (
		<SidebarInset>
			{/* Cabeçalho com navegação breadcrumb */}
			<header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
				<div className='flex items-center gap-2 px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator
						orientation='vertical'
						className='mr-2 data-[orientation=vertical]:h-4'
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbLink href='/dashboard/schedule/stopday'>
									Agendamentos
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Feriados</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className='flex flex-1 flex-col gap-4 p-4'>
				<div className='grid gap-4'>
					<FormStopDay
						userId={userId}
						stopDayId={editingStopDay?.id}
						initialDate={
							editingStopDay ? new Date(editingStopDay.date) : undefined
						}
						initialMotivation={editingStopDay?.motivation}
						onSuccess={handleSuccess}
						onCancel={editingStopDay ? handleCancelEdit : undefined}
					/>

					{!isLoading && (
						<ListStopDays
							userId={userId}
							stopDays={stopDays}
							onEdit={handleEdit}
							onRefresh={loadStopDays}
						/>
					)}
				</div>
			</div>
		</SidebarInset>
	)
}
