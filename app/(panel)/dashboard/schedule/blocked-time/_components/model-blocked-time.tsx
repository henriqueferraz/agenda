/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Container/orquestrador da página de Bloqueios de Horário. Renderiza breadcrumb,
 * formulário de criação e lista de bloqueios existentes. Carrega dados via
 * getAllBlockedTimes e getInfoEmployee, orquestrando FormBlockedTime e ListBlockedTimes.
 *
 * @example
 * ```tsx
 * <ModelBlockedTime userId={session.userId} />
 * ```
 */
'use client'
import { useState, useEffect } from 'react'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { FormBlockedTime } from './form-blocked-time'
import { ListBlockedTimes } from './list-blocked-times'
import {
	getAllBlockedTimes,
	BlockedTimeWithEmployee,
} from '../_data-access/get-all-blocked-times'
import { getInfoEmployee } from '@/app/(panel)/dashboard/services/employee/_data-access/get-info-employee'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/** Props do container da página de Bloqueios */
interface ModelBlockedTimeProps {
	/** ID do usuário (empresa) para carregar e filtrar bloqueios */
	userId: string
}

/** Tipo simplificado de funcionário para o Select do formulário */
interface EmployeeOption {
	/** ID do funcionário */
	id: string
	/** Nome do funcionário */
	name: string
	/** Horários de segunda-feira */
	mon_times: string[]
	/** Horários de terça-feira */
	tue_times: string[]
	/** Horários de quarta-feira */
	wed_times: string[]
	/** Horários de quinta-feira */
	thu_times: string[]
	/** Horários de sexta-feira */
	fri_times: string[]
	/** Horários de sábado */
	sat_times: string[]
	/** Horários de domingo */
	sun_times: string[]
}

/**
 * Container da página de Bloqueios de Horário: breadcrumb, formulário e lista.
 *
 * @param props - userId do usuário logado
 * @returns React.JSX.Element
 *
 * @example
 * ```tsx
 * <ModelBlockedTime userId="usr_123" />
 * ```
 */
export const ModelBlockedTime = ({ userId }: ModelBlockedTimeProps) => {
	const [blockedTimes, setBlockedTimes] = useState<BlockedTimeWithEmployee[]>([])
	const [employees, setEmployees] = useState<EmployeeOption[]>([])
	const [isLoading, setIsLoading] = useState(true)

	const loadData = async () => {
		setIsLoading(true)
		try {
			const [blockedData, employeeData] = await Promise.all([
				getAllBlockedTimes({ userId }),
				getInfoEmployee({ userId }),
			])
			setBlockedTimes(blockedData)
			setEmployees(
				employeeData.map((emp) => ({
					id: emp.id,
					name: emp.name,
					mon_times: emp.mon_times,
					tue_times: emp.tue_times,
					wed_times: emp.wed_times,
					thu_times: emp.thu_times,
					fri_times: emp.fri_times,
					sat_times: emp.sat_times,
					sun_times: emp.sun_times,
				})),
			)
		} catch (error) {
			console.error('Erro ao carregar dados de bloqueios:', error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		loadData()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId])

	const handleSuccess = () => {
		loadData()
	}

	return (
		<SidebarInset>
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
								<BreadcrumbLink href='/dashboard/schedule/calendar'>
									Agendamentos
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Bloqueios de Horário</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className='flex flex-1 flex-col gap-4 p-4'>
				<div className='grid gap-4'>
					<FormBlockedTime
						userId={userId}
						employees={employees}
						onSuccess={handleSuccess}
					/>

					{!isLoading && (
						<ListBlockedTimes
							userId={userId}
							blockedTimes={blockedTimes}
							onRefresh={loadData}
						/>
					)}
				</div>
			</div>
		</SidebarInset>
	)
}
