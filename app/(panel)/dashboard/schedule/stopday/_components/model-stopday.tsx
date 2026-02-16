/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Layout e container da página de Feriados (Stop Days).
 * Renderiza breadcrumb (Dashboard > Agendamentos > Feriados), formulário de
 * criação/edição de feriado e lista de feriados cadastrados. Carrega os dados
 * via getAllStopDays e orquestra FormStopDay e ListStopDays.
 *
 * @example
 * ```tsx
 * <ModelStopDay userId={session.userId} />
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
/** Props do container da página de Feriados (ModelStopDay). */
interface ModelStopDayProps {
	/** ID do usuário (empresa) para carregar e filtrar feriados. */
	userId: string
}
interface StopDay {
	id: string
	date: Date
	motivation: string
	createdAt: Date
	updatedAt: Date
}
/**
 * Container da página de Feriados: breadcrumb, formulário e lista.
 * @param props - userId do usuário logado
 * @returns JSX.Element
 */
export const ModelStopDay = ({ userId }: ModelStopDayProps) => {
	const [stopDays, setStopDays] = useState<StopDay[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [editingStopDay, setEditingStopDay] = useState<StopDay | null>(null)
	const loadStopDays = async () => {
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
		setEditingStopDay(stopDay)
	}
	const handleCancelEdit = () => {
		setEditingStopDay(null)
	}
	const handleSuccess = () => {
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
