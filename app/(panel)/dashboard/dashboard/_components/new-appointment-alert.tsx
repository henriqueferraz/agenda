/**
 * Componente - New Appointment Alert
 *
 * Visao geral:
 * - Componente React para New Appointment Alert.
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
 * import * as modulo from "@/app/(panel)/dashboard/dashboard/_components/new-appointment-alert";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
'use client'
/**
 *  Componente de Alerta de Novo Agendamento
 *
 * Componente que exibe um card de notificação quando há novos agendamentos.
 * O card aparece em vermelho mostrando informações do agendamento e pode ser
 * fechado pelo usuário ao clicar no botão "Vi".
 *
 * ## Funcionalidades
 * -  Verificação periódica a cada 30 minutos
 * -  Card vermelho com informações do agendamento
 * -  Exibe: dia, hora e serviço agendado
 * -  Botão para marcar como visto
 * -  Persistência no localStorage
 * -  Auto-oculta quando não há novos agendamentos
 *
 * ## Estados
 * - `newAppointments`: Lista de novos agendamentos
 * - `viewedAppointments`: Set de IDs de agendamentos já vistos
 * - `isLoading`: Estado de carregamento
 *
 * ## Persistência
 * - Usa `localStorage` para armazenar agendamentos vistos
 * - Chave: `viewedAppointments_${userId}`
 * - Formato: JSON array de IDs
 *
 * @param userId - ID do usuário
 */
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, CalendarPlus } from 'lucide-react'
import { getNewAppointments } from '../_data-access/get-new-appointments'
import { formatDateInSaoPaulo } from '@/utils/date-timezone'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface NewAppointment {
	id: string
	name: string
	email: string
	phone: string
	appointmentDate: Date
	time: string
	service: {
		id: string
		name: string
	}
	employee: {
		id: string
		name: string
	}
	createdAt: Date
}
interface NewAppointmentAlertProps {
	userId: string
}
const STORAGE_KEY_PREFIX = 'viewedAppointments_'
const CHECK_INTERVAL = 30 * 60 * 1000 // 30 minutos em milissegundos
export const NewAppointmentAlert = ({ userId }: NewAppointmentAlertProps) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const [newAppointments, setNewAppointments] = useState<NewAppointment[]>([])
	const [viewedAppointments, setViewedAppointments] = useState<Set<string>>(
		new Set(),
	)
	const [isLoading, setIsLoading] = useState(true)
	// Carrega agendamentos vistos do localStorage
	useEffect(() => {
		const storageKey = `${STORAGE_KEY_PREFIX}${userId}`
		const stored = localStorage.getItem(storageKey)
		if (stored) {
			try {
				const viewedIds = JSON.parse(stored) as string[]
				setViewedAppointments(new Set(viewedIds))
			} catch (error) {
				console.error('Erro ao carregar agendamentos vistos:', error)
			}
		}
	}, [userId])
	// Verificação inicial e periódica
	useEffect(() => {
		// Função para buscar novos agendamentos
		const checkNewAppointments = async () => {
			// Passo 1: validar entradas e garantir o contexto esperado.
			// Passo 2: preparar dados, estado e dependencias locais.
			// Passo 3: executar a acao principal do fluxo.
			// Passo 4: tratar retorno, erros e efeitos colaterais.
			try {
				setIsLoading(true)
				const appointments = await getNewAppointments({ userId })
				setNewAppointments(appointments)
			} catch (error) {
				console.error('Erro ao buscar novos agendamentos:', error)
				setNewAppointments([])
			} finally {
				setIsLoading(false)
			}
		}
		// Verificação inicial
		checkNewAppointments()
		// Configura verificação periódica a cada 30 minutos
		const interval = setInterval(() => {
			checkNewAppointments()
		}, CHECK_INTERVAL)
		return () => clearInterval(interval)
	}, [userId])
	// Filtra agendamentos não vistos
	const unseenAppointments = newAppointments.filter(
		(apt) => !viewedAppointments.has(apt.id),
	)
	// Se não há agendamentos não vistos, renderiza card vazio (mantém espaço no grid)
	if (isLoading || unseenAppointments.length === 0) {
		return (
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>
						Novos Agendamentos
					</CardTitle>
					<CalendarPlus className='h-4 w-4 text-muted-foreground' />
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>-</div>
					<p className='text-xs text-muted-foreground'>
						Nenhum novo agendamento
					</p>
				</CardContent>
			</Card>
		)
	}
	// Pega o agendamento mais recente não visto
	const latestAppointment = unseenAppointments[0]
	// Função para marcar como visto
	const handleMarkAsViewed = () => {
		// Passo 1: validar entradas e garantir o contexto esperado.
		// Passo 2: preparar dados, estado e dependencias locais.
		// Passo 3: executar a acao principal do fluxo.
		// Passo 4: tratar retorno, erros e efeitos colaterais.
		const newViewed = new Set(viewedAppointments)
		newViewed.add(latestAppointment.id)
		setViewedAppointments(newViewed)
		// Salva no localStorage
		const storageKey = `${STORAGE_KEY_PREFIX}${userId}`
		localStorage.setItem(storageKey, JSON.stringify(Array.from(newViewed)))
		// Remove o agendamento da lista
		setNewAppointments((prev) =>
			prev.filter((apt) => apt.id !== latestAppointment.id),
		)
	}
	// Formata a data do agendamento (formato curto como nos outros cards)
	const formattedDate = formatDateInSaoPaulo(
		latestAppointment.appointmentDate,
		{
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		},
	)
	return (
		<Card className='border-red-500 bg-red-50 dark:bg-red-950/20'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
				<CardTitle className='text-sm font-medium text-red-900 dark:text-red-100'>
					Novo Agendamento
				</CardTitle>
				<AlertCircle className='h-4 w-4 text-red-600' />
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3'>
					<div>
						<span className='font-medium'>Data: </span>
						<span>{formattedDate}</span>
					</div>
					<div>
						<span className='font-medium'>Horário: </span>
						<span>{latestAppointment.time}</span>
					</div>
					<div>
						<span className='font-medium'>Funcionário: </span>
						<span>{latestAppointment.employee.name}</span>
					</div>
					<div>
						<span className='font-medium'>Serviço: </span>
						<span>{latestAppointment.service.name}</span>
					</div>
				</div>
				<Button
					onClick={handleMarkAsViewed}
					variant='outline'
					size='sm'
					className='w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30 flex items-center justify-center'
				>
					<CheckCircle2 className='h-4 w-4' />
				</Button>
			</CardContent>
		</Card>
	)
}
