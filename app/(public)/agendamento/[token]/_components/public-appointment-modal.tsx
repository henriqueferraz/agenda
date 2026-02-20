/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Modal de agendamento público. Exibe o fluxo completo de agendamento para o
 * cliente: seleção de serviços, funcionário e horário, dados do cliente com CPF
 * e autocomplete (F-10), e confirmação. Valida datas passadas e feriados,
 * calcula horários disponíveis por serviço/funcionário e chama o webhook.
 *
 * @example
 * <PublicAppointmentModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   date={selectedDate}
 *   companyTimes={companyTimes}
 *   employees={employees}
 *   services={services}
 *   userId={userId}
 *   token={token}
 * />
 */
'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Loader2, Calendar, Clock, User, Briefcase } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency } from '@/lib/utils'
import { formatPhone, unformatPhone } from '@/utils/formatPhone'
import { formatCPF, isCPFValid, unformatCPF } from '@/utils/formatCPF'
import { searchClientByCpf } from '@/app/(panel)/dashboard/clients/_data-access/search-client-by-cpf'
import { createPublicAppointment } from '../_actions/create-public-appointment'
import { getDayAppointments } from '@/app/(panel)/dashboard/schedule/calendar/_data-access/get-day-appointments'
import { getStopDayByDate } from '@/app/(panel)/dashboard/schedule/stopday/_data-access/get-stopday-by-date'
import {
	getNowInSaoPaulo,
	startOfDayInSaoPaulo,
	compareDatesInSaoPaulo,
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
	formatDateInSaoPaulo,
} from '@/utils/date-timezone'
interface CompanyTimes {
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
}
interface Service {
	id: string
	name: string
	price: number
	duration: number
	status: boolean
}
interface EmployeeService {
	id: string
	service: Service
}
interface Employee {
	id: string
	name: string
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
	services: EmployeeService[]
}
interface AppointmentEmployee {
	id: string
	name: string
	mon_times: string[]
	tue_times: string[]
	wed_times: string[]
	thu_times: string[]
	fri_times: string[]
	sat_times: string[]
	sun_times: string[]
	services?: EmployeeService[]
}
interface Appointment {
	id: string
	time: string
	serviceId: string
	employeeId: string
	/** Status do agendamento (confirmed, cancelled). */
	status: string
	service: Service
	employee: AppointmentEmployee
}
/**
 * Props do componente PublicAppointmentModal.
 */
interface PublicAppointmentModalProps {
	/** Se o modal está aberto */
	open: boolean
	/** Callback quando o modal é fechado */
	onOpenChange: (open: boolean) => void
	/** Data selecionada */
	date: Date
	/** Horários de funcionamento da empresa */
	companyTimes: CompanyTimes | null
	/** Lista de funcionários */
	employees: Employee[]
	/** Lista de serviços disponíveis */
	services: Service[]
	/** ID do usuário (empresa) - usado para buscar agendamentos e feriados */
	userId: string
	/** Token único da empresa - usado para criar agendamento público */
	token: string
}
interface SelectedService {
	serviceId: string
	employeeId: string | null
	time: string | null
}
const DAYS_MAP: Record<number, keyof CompanyTimes> = {
	0: 'sun_times',
	1: 'mon_times',
	2: 'tue_times',
	3: 'wed_times',
	4: 'thu_times',
	5: 'fri_times',
	6: 'sat_times',
}
/**
 * Modal de agendamento público: seleção de serviços, horários e dados do cliente.
 *
 * @param props - Props do modal (open, onOpenChange, date, companyTimes, employees, services, userId, token)
 * @returns JSX.Element
 */
export const PublicAppointmentModal = ({
	open,
	onOpenChange,
	date,
	companyTimes,
	employees,
	services,
	userId,
	token,
}: PublicAppointmentModalProps) => {
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
	const [existingAppointments, setExistingAppointments] = useState<
		Appointment[]
	>([])
	const [refreshKey, setRefreshKey] = useState(0) // Força recálculo de horários disponíveis
	const [stopDay, setStopDay] = useState<{
		id: string
		date: Date
		motivation: string
	} | null>(null)
	// Modal de confirmação
	const [showConfirmationModal, setShowConfirmationModal] = useState(false)
	const [createdAppointments, setCreatedAppointments] = useState<
		Array<{
			id: string
			name: string
			email: string
			phone: string
			appointmentDate: Date | string
			time: string
			service: Service
			employee: AppointmentEmployee
		}>
	>([])
	// Dados do cliente
	const [clientCpf, setClientCpf] = useState('')
	const [cpfError, setCpfError] = useState('')
	const [isSearchingCpf, setIsSearchingCpf] = useState(false)
	const [clientFoundByCpf, setClientFoundByCpf] = useState(false)
	const [clientName, setClientName] = useState('')
	const [clientEmail, setClientEmail] = useState('')
	const [clientPhone, setClientPhone] = useState('')
	// Serviços selecionados
	const [selectedServices, setSelectedServices] = useState<Set<string>>(
		new Set(),
	)
	// Configuração de cada serviço selecionado
	const [serviceConfigs, setServiceConfigs] = useState<
		Map<string, SelectedService>
	>(new Map())
	const dayOfWeek = date.getDay()
	const dayKey = DAYS_MAP[dayOfWeek]
	// Carrega agendamentos existentes quando o modal abre ou quando a data muda
	useEffect(() => {
		if (open && date) {
			loadExistingAppointments()
			// Verifica feriado apenas como fallback (já verificado antes de abrir o modal)
			checkStopDay()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, date, userId])
	const checkStopDay = async () => {
		try {
			const stopDayData = await getStopDayByDate({ userId, date })
			if (stopDayData) {
				setStopDay({
					id: stopDayData.id,
					date: new Date(stopDayData.date),
					motivation: stopDayData.motivation,
				})
				// Se for feriado, fecha o modal imediatamente (não deveria ter aberto)
				if (open) {
					onOpenChange(false)
				}
			} else {
				setStopDay(null)
			}
		} catch (error) {
			console.error('Erro ao verificar feriado:', error)
			setStopDay(null)
		}
	}
	// Recarrega agendamentos quando isLoading muda de true para false (após salvar)
	useEffect(() => {
		if (open && !isLoading && date) {
			// Pequeno delay para garantir que o banco foi atualizado
			const timer = setTimeout(() => {
				loadExistingAppointments()
			}, 500)
			return () => clearTimeout(timer)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoading, open, date])
	const loadExistingAppointments = useMemo(() => {
		return async () => {
			setIsLoadingAppointments(true)
			try {
				const appointments = await getDayAppointments({ userId, date })
				setExistingAppointments(appointments)
				// Força recálculo dos horários disponíveis
				setRefreshKey((prev) => prev + 1)
			} catch (error) {
				console.error('Erro ao carregar agendamentos:', error)
				toast.error('Erro ao carregar agendamentos existentes')
			} finally {
				setIsLoadingAppointments(false)
			}
		}
	}, [userId, date])
	// Horários disponíveis da empresa para este dia
	const companyAvailableTimes = useMemo(() => {
		if (!companyTimes || !dayKey) return []
		return [...(companyTimes[dayKey] || [])].sort()
	}, [companyTimes, dayKey])
	// Função para obter funcionários que podem realizar um serviço
	const getEmployeesForService = (serviceId: string): Employee[] => {
		return employees
			.filter((emp) => emp.services.some((es) => es.service.id === serviceId))
			.filter((emp) => {
				const normalizedName = emp.name.trim().toLowerCase()
				return (
					normalizedName !== 'novo funcionário' &&
					normalizedName !== 'novo funcionario'
				)
			})
			.sort((a, b) => a.name.localeCompare(b.name))
	}
	// Função para obter horários disponíveis de um funcionário
	const getEmployeeTimes = (employee: Employee): string[] => {
		if (!dayKey) return []
		return employee[dayKey] || []
	}
	/**
	 * Chama o webhook após a confirmação do agendamento
	 * Envia os dados do cliente e serviços agendados via POST
	 */
	const callAppointmentWebhook = async (
		appointments: Array<{
			id: string
			name: string
			email: string
			phone: string
			appointmentDate: Date | string
			time: string
			service: Service
			employee: AppointmentEmployee
			managementToken?: string | null
		}>,
		clientName: string,
		clientEmail: string,
		clientPhone: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_appointmentDate: Date,
	) => {
		try {
			// URL do N8N é resolvida server-side na API route /api/webhook/appointment
			// O cliente envia para a API route que faz o proxy com a variável BASE_N8N
			// Prepara os dados para envio (um por serviço) no formato especificado do N8N
			const appointmentsToSend = appointments.map((apt) => {
				const aptDate = new Date(apt.appointmentDate)
				// Formata data como YYYY-MM-DD usando timezone America/Sao_Paulo
				const dateComponents = getDateComponentsInSaoPaulo(aptDate)
				const dateStr = `${dateComponents.year}-${String(dateComponents.month + 1).padStart(2, '0')}-${String(dateComponents.day).padStart(2, '0')}`
				// Formata telefone para o formato esperado
				const formattedPhone = formatPhone(clientPhone)
				// Formata o payload no formato especificado do N8N (array com objeto)
				return [
					{
						headers: {},
						params: {},
						query: {},
				body: {
					type: 'create',
					name: clientName,
					email: clientEmail,
					phone: formattedPhone,
					token_called: token,
					reason: '',
					oldDate: '',
					oldTime: '',
					newDate: '',
					newTime: '',
					managementLink: apt.managementToken
						? `${window.location.origin}/agendamento/gerenciar/${apt.managementToken}`
						: '',
					appointments: [
							{
								date: dateStr,
								time: apt.time,
								services: [
									{
										id: apt.service.id,
										name: apt.service.name,
										price: apt.service.price,
										duration: apt.service.duration,
										employee: {
											id: apt.employee.id,
											name: apt.employee.name,
										},
									},
								],
							},
						],
					},
						webhookUrl: '',
						executionMode: 'production',
					},
				]
			})
			// Ordena por data e depois por horário
			appointmentsToSend.sort((a, b) => {
				const dateA = a[0].body.appointments[0].date
				const dateB = b[0].body.appointments[0].date
				const timeA = a[0].body.appointments[0].time
				const timeB = b[0].body.appointments[0].time
				if (dateA !== dateB) {
					return dateA.localeCompare(dateB)
				}
				return timeA.localeCompare(timeB)
			})
			// Chama a API route do Next.js que faz o proxy para o N8N
			const apiUrl = '/api/webhook/appointment'
			// Envia uma mensagem por serviço com intervalo de 5 segundos
			for (let i = 0; i < appointmentsToSend.length; i++) {
				const payload = appointmentsToSend[i]
				// Cria um AbortController para timeout
				const controller = new AbortController()
				const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos
				try {
				// Faz a chamada POST para a API route do Next.js com proteção anti-replay
				const response = await fetch(apiUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
							'x-webhook-nonce': crypto.randomUUID(),
						},
						body: JSON.stringify(payload),
						signal: controller.signal,
					})
					clearTimeout(timeoutId)
					if (!response.ok) {
						const errorText = await response
							.text()
							.catch(() => 'Não foi possível ler a resposta')
						const serviceName = payload[0].body.appointments[0].services[0].name
						console.error(
							` [WEBHOOK] Erro HTTP ao enviar webhook ${i + 1}/${appointmentsToSend.length}:`,
							{
								status: response.status,
								statusText: response.statusText,
								error: errorText,
								service: serviceName,
							},
						)
					}
				} catch (fetchError) {
					clearTimeout(timeoutId)
					const serviceName = payload[0].body.appointments[0].services[0].name
					console.error(
						` [WEBHOOK] Erro ao enviar webhook ${i + 1}/${appointmentsToSend.length}:`,
						{
							error:
								fetchError instanceof Error ? fetchError.message : fetchError,
							service: serviceName,
						},
					)
				}
				// Aguarda 5 segundos antes de enviar a próxima mensagem (exceto na última)
				if (i < appointmentsToSend.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, 5000))
				}
			}
		} catch (error) {
			// Erros do webhook não devem interromper o fluxo do agendamento
			if (error instanceof TypeError && error.message.includes('fetch')) {
				console.error(' Erro de tipo ao chamar webhook N8N:', {
					message: error.message,
					tipo: 'Erro de rede/CORS - Verifique se a API route está acessível',
				})
			} else if (error instanceof Error) {
				console.error(' Erro ao chamar webhook de agendamento:', {
					message: error.message,
				})
			} else {
				console.error(
					' Erro desconhecido ao chamar webhook de agendamento:',
					error,
				)
			}
		}
	}
	/**
	 * Marca um intervalo de horários como ocupado no Set, usando intervalos de 30 minutos.
	 * @param occupied - Set de horários ocupados a ser preenchido
	 * @param startTime - Horário de início (HH:MM)
	 * @param duration - Duração do serviço em minutos
	 */
	const markOccupiedRange = (occupied: Set<string>, startTime: string, duration: number): void => {
		occupied.add(startTime)
		const [hours, minutes] = startTime.split(':').map(Number)
		let currentMinutes = hours * 60 + minutes
		const endMinutes = currentMinutes + duration
		currentMinutes += 30
		while (currentMinutes < endMinutes) {
			const timeStr = `${Math.floor(currentMinutes / 60)
				.toString()
				.padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`
			if (companyAvailableTimes.includes(timeStr)) {
				occupied.add(timeStr)
			}
			currentMinutes += 30
		}
		const endTimeStr = `${Math.floor(endMinutes / 60)
			.toString()
			.padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`
		if (companyAvailableTimes.includes(endTimeStr)) {
			occupied.add(endTimeStr)
		}
	}
	/**
	 * Calcula horários ocupados por um funcionário (agendamentos do banco + sessão atual).
	 * @param employeeId - ID do funcionário
	 * @param currentServiceId - ID do serviço sendo avaliado (excluído da verificação de sessão)
	 */
	const getOccupiedTimes = (employeeId: string, currentServiceId?: string): Set<string> => {
		const occupied = new Set<string>()
		// 1. Horários do banco de dados para este funcionário
		existingAppointments.forEach((apt) => {
			if (apt.status === 'cancelled') return
			if (apt.employeeId === employeeId) {
				const service = services.find((s) => s.id === apt.serviceId)
				if (service) {
					markOccupiedRange(occupied, apt.time, service.duration)
				}
			}
		})
		// 2. Horários selecionados na sessão atual para o MESMO funcionário (outros serviços)
		if (currentServiceId) {
			serviceConfigs.forEach((config, svcId) => {
				if (svcId === currentServiceId) return
				if (!config.time || config.employeeId !== employeeId) return
				const service = services.find((s) => s.id === svcId)
				if (!service) return
				markOccupiedRange(occupied, config.time, service.duration)
			})
		}
		return occupied
	}
	/**
	 * Retorna horários ocupados por TODOS os serviços selecionados na sessão atual
	 * (exceto o serviço informado), independente do funcionário.
	 * Previne conflito de cliente (F-01): o mesmo cliente não pode ter
	 * agendamentos sobrepostos, mesmo com funcionários diferentes.
	 * @param currentServiceId - ID do serviço sendo avaliado (excluído)
	 */
	const getSessionOccupiedTimes = (currentServiceId: string): Set<string> => {
		const occupied = new Set<string>()
		serviceConfigs.forEach((config, svcId) => {
			if (svcId === currentServiceId) return
			if (!config.time) return
			const service = services.find((s) => s.id === svcId)
			if (!service) return
			markOccupiedRange(occupied, config.time, service.duration)
		})
		return occupied
	}
	// Função para verificar se um horário não é passado (usando timezone America/Sao_Paulo)
	const isTimeNotPast = (time: string): boolean => {
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		const selectedDay = startOfDayInSaoPaulo(date)
		// Se a data selecionada é hoje, verifica se o horário não passou
		if (compareDatesInSaoPaulo(selectedDay, today) === 0) {
			const [hours, minutes] = time.split(':').map(Number)
			const dateComponents = getDateComponentsInSaoPaulo(now)
			const appointmentTime = createDateInSaoPaulo(
				dateComponents.year,
				dateComponents.month,
				dateComponents.day,
				hours,
				minutes,
				0,
				0,
			)
			return appointmentTime >= now
		}
		// Se a data é futura, o horário está disponível
		return compareDatesInSaoPaulo(selectedDay, today) > 0
	}
	/**
	 * Verifica se um horário está disponível para um serviço, considerando:
	 * - Agendamentos existentes no banco (por funcionário)
	 * - Serviços já selecionados na sessão atual (por funcionário e por cliente — F-01)
	 */
	const isTimeAvailableForService = (
		time: string,
		serviceId: string,
		employeeId: string | null,
	): boolean => {
		if (!isTimeNotPast(time)) return false
		if (!companyAvailableTimes.includes(time)) return false
		// Conflito de cliente na sessão (F-01): mesmo cliente não pode ter sobreposição
		const sessionOccupied = getSessionOccupiedTimes(serviceId)
		if (sessionOccupied.has(time)) return false
		if (!employeeId) {
			const availableEmployees = getEmployeesForService(serviceId)
			return availableEmployees.some((emp) => {
				const empTimes = getEmployeeTimes(emp)
				const occupied = getOccupiedTimes(emp.id, serviceId)
				return empTimes.includes(time) && !occupied.has(time)
			})
		}
		const employee = employees.find((e) => e.id === employeeId)
		if (!employee) return false
		const empTimes = getEmployeeTimes(employee)
		if (!empTimes.includes(time)) return false
		const occupied = getOccupiedTimes(employeeId, serviceId)
		if (occupied.has(time)) return false
		const service = services.find((s) => s.id === serviceId)
		if (!service) return false
		const [hours, minutes] = time.split(':').map(Number)
		let currentMinutes = hours * 60 + minutes
		const endMinutes = currentMinutes + service.duration
		const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
		if (occupied.has(startTimeStr)) return false
		currentMinutes += 30
		while (currentMinutes < endMinutes) {
			const timeStr = `${Math.floor(currentMinutes / 60)
				.toString()
				.padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`
			if (!companyAvailableTimes.includes(timeStr)) return false
			if (!empTimes.includes(timeStr)) return false
			if (occupied.has(timeStr)) return false
			if (sessionOccupied.has(timeStr)) return false
			currentMinutes += 30
		}
		return true
	}
	// Função para obter horários disponíveis para um serviço
	// Esta função é recalculada sempre que existingAppointments muda
	const getAvailableTimesForService = (
		serviceId: string,
		employeeId: string | null,
	): string[] => {
		// refreshKey força o React a recalcular quando muda
		void refreshKey // Usa refreshKey para forçar recálculo
		return companyAvailableTimes.filter((time) =>
			isTimeAvailableForService(time, serviceId, employeeId),
		)
	}
	// Toggle seleção de serviço
	const toggleService = (serviceId: string) => {
		const newSelected = new Set(selectedServices)
		const newConfigs = new Map(serviceConfigs)
		if (newSelected.has(serviceId)) {
			newSelected.delete(serviceId)
			newConfigs.delete(serviceId)
		} else {
			newSelected.add(serviceId)
			// Seleciona automaticamente o primeiro funcionário disponível
			const availableEmployees = getEmployeesForService(serviceId)
			const firstEmployee = availableEmployees[0]
			newConfigs.set(serviceId, {
				serviceId,
				employeeId: firstEmployee?.id || null,
				time: null,
			})
		}
		setSelectedServices(newSelected)
		setServiceConfigs(newConfigs)
	}
	// Atualiza funcionário para um serviço
	const updateServiceEmployee = (
		serviceId: string,
		employeeId: string | null,
	) => {
		const newConfigs = new Map(serviceConfigs)
		const config = newConfigs.get(serviceId)
		if (config) {
			newConfigs.set(serviceId, {
				...config,
				employeeId,
				time: null, // Reseta o horário quando muda o funcionário
			})
			setServiceConfigs(newConfigs)
		}
	}
	// Atualiza horário para um serviço
	const updateServiceTime = (serviceId: string, time: string) => {
		const newConfigs = new Map(serviceConfigs)
		const config = newConfigs.get(serviceId)
		if (config) {
			newConfigs.set(serviceId, {
				...config,
				time,
			})
			setServiceConfigs(newConfigs)
			// Força recálculo dos horários disponíveis de TODOS os serviços
			setRefreshKey((prev) => prev + 1)
		}
	}
	const handleCpfChange = (rawValue: string) => {
		const digits = rawValue.replace(/\D/g, '').slice(0, 11)
		const { formatted } = formatCPF(digits)
		setClientCpf(digits.length === 11 ? formatted : digits)
		setCpfError('')
		setClientFoundByCpf(false)
		if (digits.length === 11) {
			if (!isCPFValid(digits)) {
				setCpfError('CPF inválido')
			} else {
				handleCpfSearch(digits)
			}
		}
	}
	const handleCpfSearch = async (digits: string) => {
		setIsSearchingCpf(true)
		try {
			const client = await searchClientByCpf({ cpf: digits, userId })
			if (client) {
				setClientName(client.name)
				setClientEmail(client.email)
				setClientPhone(formatPhone(client.phone))
				setClientFoundByCpf(true)
				toast.success('Dados preenchidos automaticamente.')
			}
		} catch {
			// Falha silenciosa — cliente poderá preencher manualmente
		} finally {
			setIsSearchingCpf(false)
		}
	}
	const validateForm = (): boolean => {
		const cpfDigits = unformatCPF(clientCpf)
		if (!cpfDigits || cpfDigits.length !== 11) {
			toast.error('CPF é obrigatório')
			return false
		}
		if (!isCPFValid(cpfDigits)) {
			toast.error('CPF inválido')
			return false
		}
		if (!clientName.trim()) {
			toast.error('Nome é obrigatório')
			return false
		}
		if (!clientEmail.trim()) {
			toast.error('Email é obrigatório')
			return false
		}
		if (!clientPhone.trim()) {
			toast.error('Telefone é obrigatório')
			return false
		}
		// Validação de telefone brasileiro (L-09)
		const phoneDigits = unformatPhone(clientPhone)
		if (!/^\d{10,11}$/.test(phoneDigits)) {
			toast.error('Telefone deve ter 10 ou 11 dígitos (DDD + número)')
			return false
		}
		const ddd = parseInt(phoneDigits.substring(0, 2), 10)
		if (ddd < 11 || ddd > 99) {
			toast.error('DDD inválido')
			return false
		}
		// Celular (11 dígitos) deve ter 9 como terceiro dígito
		if (phoneDigits.length === 11 && phoneDigits[2] !== '9') {
			toast.error('Celular deve começar com 9 após o DDD')
			return false
		}
		if (selectedServices.size === 0) {
			toast.error('Selecione pelo menos um serviço')
			return false
		}
		// Verifica se todos os serviços têm horário selecionado
		for (const serviceId of selectedServices) {
			const config = serviceConfigs.get(serviceId)
			if (!config?.time) {
				const service = services.find((s) => s.id === serviceId)
				toast.error(`Selecione um horário para o serviço "${service?.name}"`)
				return false
			}
		}
		return true
	}
	// Salva agendamentos
	const handleSave = async () => {
		if (!validateForm()) return
		setIsLoading(true)
		try {
			const results: Array<{ success: boolean; error?: string; data?: unknown; serviceName: string }> = []
			const serviceIds = Array.from(selectedServices)
			for (let i = 0; i < serviceIds.length; i++) {
				const serviceId = serviceIds[i]
				const config = serviceConfigs.get(serviceId)
				if (!config?.time || !config.employeeId) continue
				const serviceName = services.find((s) => s.id === serviceId)?.name ?? serviceId
				const result = await createPublicAppointment({
					name: clientName,
					email: clientEmail,
					phone: unformatPhone(clientPhone),
					cpf: unformatCPF(clientCpf),
					appointmentDate: date,
					time: config.time,
					token,
					serviceId,
					employeeId: config.employeeId,
				})
				results.push({ ...result, serviceName })
				if (!result.success) {
					console.error(
						`Erro ao criar agendamento para serviço ${serviceName}:`,
						result.error,
					)
				}
			}
			const successResults = results.filter((r) => r.success)
			const failedResults = results.filter((r) => !r.success)
			if (successResults.length > 0) {
			const successfulAppointments = successResults
				.filter((r) => r.data)
				.map((r) => r.data) as Array<{
					id: string
					name: string
					email: string
					phone: string
					appointmentDate: Date | string
					time: string
					service: Service
					employee: AppointmentEmployee
					managementToken?: string | null
				}>
				setCreatedAppointments(successfulAppointments)
				onOpenChange(false)
				setShowConfirmationModal(true)
				if (successfulAppointments.length > 0) {
					callAppointmentWebhook(
						successfulAppointments,
						clientName,
						clientEmail,
						clientPhone,
						date,
					).catch((error) => {
						console.error(
							' [WEBHOOK] Erro não tratado na chamada do webhook:',
							error,
						)
					})
				} else {
					console.warn(
						' [WEBHOOK] Nenhum agendamento bem-sucedido para enviar ao webhook',
					)
				}
				if (failedResults.length > 0) {
					setTimeout(() => {
						failedResults.forEach((r) => {
							toast.error(`${r.serviceName}: ${r.error ?? 'Erro desconhecido'}`)
						})
					}, 500)
				} else {
					setTimeout(() => {
						toast.success(
							`${successResults.length} agendamento(s) criado(s) com sucesso!`,
						)
					}, 500)
				}
			} else {
				const firstError = failedResults[0]
				toast.error(firstError?.error ?? 'Erro ao criar agendamento.')
			}
		} catch (error) {
			console.error('Erro ao salvar agendamentos:', error)
			toast.error('Erro inesperado ao criar agendamentos')
		} finally {
			setIsLoading(false)
		}
	}
	const handleClose = () => {
		setClientCpf('')
		setCpfError('')
		setClientFoundByCpf(false)
		setClientName('')
		setClientEmail('')
		setClientPhone('')
		setSelectedServices(new Set())
		setServiceConfigs(new Map())
		setCreatedAppointments([])
		onOpenChange(false)
	}
	// Fecha o modal de confirmação e limpa tudo
	const handleCloseConfirmation = () => {
		setShowConfirmationModal(false)
		// Limpa os estados do formulário
		handleClose()
		// Recarrega a página para atualizar o calendário e a agenda diária
		// Usa setTimeout para garantir que o modal feche antes do reload
		setTimeout(() => {
			window.location.reload()
		}, 100)
	}
	const formattedDate = useMemo(() => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}
		return formatDateInSaoPaulo(date, options)
	}, [date])
	// Verifica se a data não é passada (usando timezone America/Sao_Paulo)
	const isDatePast = useMemo(() => {
		const now = getNowInSaoPaulo()
		const today = startOfDayInSaoPaulo(now)
		const selectedDay = startOfDayInSaoPaulo(date)
		return compareDatesInSaoPaulo(selectedDay, today) < 0
	}, [date])
	if (isDatePast) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agendar - {formattedDate}</DialogTitle>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-sm text-muted-foreground'>
							Não é possível agendar em datas passadas.
						</p>
					</div>
				</DialogContent>
			</Dialog>
		)
	}
	// Verifica se é um feriado (fallback - não deveria chegar aqui se a verificação anterior funcionou)
	// Se chegar aqui, o modal será fechado automaticamente pelo checkStopDay
	// Não renderiza o conteúdo do modal se for feriado, mas mantém o Dialog para evitar erros de renderização
	if (stopDay) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agendar - {formattedDate}</DialogTitle>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-sm text-muted-foreground'>
							Verificando disponibilidade...
						</p>
					</div>
				</DialogContent>
			</Dialog>
		)
	}
	if (!companyTimes || companyAvailableTimes.length === 0) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agendar - {formattedDate}</DialogTitle>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-sm text-muted-foreground'>
							A empresa está fechada neste dia.
						</p>
					</div>
				</DialogContent>
			</Dialog>
		)
	}
	return (
		<>
			<Dialog
				open={open && !showConfirmationModal}
				onOpenChange={(isOpen) => {
					// Se o modal de confirmação estiver aberto, não fecha o modal principal
					if (!isOpen && showConfirmationModal) {
						return
					}
					onOpenChange(isOpen)
				}}
			>
				<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Calendar className='h-5 w-5' />
							Agendar - {formattedDate}
						</DialogTitle>
						<DialogDescription>
							Selecione os serviços desejados e preencha os dados do cliente
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-6 py-4'>
						{/* Seleção de Serviços */}
						<div className='space-y-4'>
							<h3 className='font-semibold text-sm'>Serviços Disponíveis</h3>
							{services.length === 0 ? (
								<p className='text-sm text-muted-foreground'>
									Nenhum serviço cadastrado.
								</p>
							) : (
								<div className='space-y-4'>
									{services.map((service) => {
										const isSelected = selectedServices.has(service.id)
										const config = serviceConfigs.get(service.id)
										const availableEmployees = getEmployeesForService(
											service.id,
										)
										const availableTimes = getAvailableTimesForService(
											service.id,
											config?.employeeId || null,
										)
										return (
											<div
												key={service.id}
												className={cn(
													'p-4 rounded-lg border',
													isSelected
														? 'bg-blue-50 border-blue-200'
														: 'bg-gray-50 border-gray-200',
												)}
											>
												<div className='flex items-start gap-3'>
													<Checkbox
														checked={isSelected}
														onCheckedChange={() => toggleService(service.id)}
													/>
													<div className='flex-1 space-y-3'>
														<div>
															<h4 className='font-semibold text-sm'>
																{service.name}
															</h4>
															<p className='text-xs text-muted-foreground'>
																Duração: {service.duration} minutos | Preço: R${' '}
																{(service.price / 100)
																	.toFixed(2)
																	.replace('.', ',')}
															</p>
														</div>

														{isSelected && (
															<div className='space-y-3 pt-2'>
																{/* Seleção de Funcionário */}
																{availableEmployees.length > 0 ? (
																	<div className='space-y-2'>
																		<Label className='text-xs'>
																			Funcionário
																		</Label>
																		<Select
																			value={config?.employeeId || ''}
																			onValueChange={(value) =>
																				updateServiceEmployee(
																					service.id,
																					value || null,
																				)
																			}
																		>
																			<SelectTrigger className='h-9'>
																				<SelectValue placeholder='Selecione um funcionário' />
																			</SelectTrigger>
																			<SelectContent>
																				{availableEmployees.map((emp) => (
																					<SelectItem
																						key={emp.id}
																						value={emp.id}
																					>
																						{emp.name}
																					</SelectItem>
																				))}
																			</SelectContent>
																		</Select>
																	</div>
																) : (
																	<p className='text-xs text-muted-foreground'>
																		Nenhum funcionário disponível para este
																		serviço
																	</p>
																)}

																{/* Seleção de Horário */}
																{availableTimes.length > 0 ? (
																	<div className='space-y-2'>
																		<Label className='text-xs'>
																			Horário Disponível
																		</Label>
																		<div className='grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto'>
																			{availableTimes.map((time) => {
																				const isSelected = config?.time === time
																				return (
																					<Button
																						key={time}
																						type='button'
																						variant={
																							isSelected ? 'default' : 'outline'
																						}
																						size='sm'
																						className={cn(
																							'text-xs',
																							isSelected &&
																							'bg-blue-600 text-white',
																						)}
																						onClick={() =>
																							updateServiceTime(
																								service.id,
																								time,
																							)
																						}
																					>
																						{time}
																					</Button>
																				)
																			})}
																		</div>
																	</div>
																) : (
																	<p className='text-xs text-muted-foreground'>
																		Nenhum horário disponível para este serviço
																	</p>
																)}
															</div>
														)}
													</div>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</div>

						<Separator />

						{/* Dados do Cliente */}
						<div className='space-y-4'>
							<h3 className='font-semibold text-sm'>Seus Dados</h3>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='clientCpf'>CPF *</Label>
									<div className='relative'>
										<Input
											id='clientCpf'
											value={clientCpf}
											onChange={(e) => handleCpfChange(e.target.value)}
											placeholder='000.000.000-00'
											maxLength={14}
											className='min-h-[44px]'
											aria-label='Seu CPF'
										/>
										{isSearchingCpf && (
											<Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground' />
										)}
									</div>
									{cpfError && (
										<p className='text-sm text-destructive'>{cpfError}</p>
									)}
									{clientFoundByCpf && (
										<p className='text-sm text-green-600'>Dados preenchidos automaticamente</p>
									)}
								</div>
								<div className='space-y-2'>
									<Label htmlFor='clientName'>Nome *</Label>
									<Input
										id='clientName'
										value={clientName}
										onChange={(e) => setClientName(e.target.value)}
										placeholder='Nome completo'
										maxLength={100}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='clientEmail'>Email *</Label>
									<Input
										id='clientEmail'
										type='email'
										value={clientEmail}
										onChange={(e) => setClientEmail(e.target.value)}
										placeholder='email@exemplo.com'
										maxLength={255}
									/>
								</div>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='clientPhone'>Telefone *</Label>
									<Input
										id='clientPhone'
										value={clientPhone}
										onChange={(e) => {
											const numericValue = e.target.value.replace(/\D/g, '')
											const limitedValue = numericValue.slice(0, 11)
											const formatted = formatPhone(limitedValue)
											setClientPhone(formatted)
										}}
										placeholder='(00) 00000-0000'
										maxLength={15}
									/>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={handleClose}
							disabled={isLoading}
						>
							Cancelar
						</Button>
						<Button
							type='button'
							onClick={handleSave}
							disabled={isLoading || isLoadingAppointments}
						>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Salvando...
								</>
							) : (
								'Agendar'
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={showConfirmationModal}
				onOpenChange={(open) => {
					if (!open) {
						handleCloseConfirmation()
					} else {
						setShowConfirmationModal(open)
					}
				}}
			>
				<DialogContent className='w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<Calendar className='h-5 w-5 text-green-600' />
							Agendamento Confirmado!
						</DialogTitle>
						<DialogDescription>
							Seu agendamento foi criado com sucesso. Confira os detalhes
							abaixo:
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-6 py-4'>
						{/* Dados do Cliente */}
						<div className='space-y-3'>
							<h3 className='font-semibold text-lg flex items-center gap-2'>
								<User className='h-4 w-4' />
								Dados do Cliente
							</h3>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4 pl-6'>
								<div>
									<Label className='text-sm text-muted-foreground'>Nome</Label>
									<p className='font-medium'>
										{createdAppointments.length > 0
											? createdAppointments[0].name
											: clientName}
									</p>
								</div>
								<div>
									<Label className='text-sm text-muted-foreground'>Email</Label>
									<p className='font-medium'>
										{createdAppointments.length > 0
											? createdAppointments[0].email
											: clientEmail}
									</p>
								</div>
								<div>
									<Label className='text-sm text-muted-foreground'>
										Telefone
									</Label>
									<p className='font-medium'>
										{createdAppointments.length > 0
											? formatPhone(createdAppointments[0].phone)
											: formatPhone(clientPhone)}
									</p>
								</div>
								<div>
									<Label className='text-sm text-muted-foreground'>Data</Label>
									<p className='font-medium'>
										{createdAppointments.length > 0 &&
											createdAppointments[0]?.appointmentDate
											? new Date(
												createdAppointments[0].appointmentDate,
											).toLocaleDateString('pt-BR', {
												weekday: 'long',
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})
											: date.toLocaleDateString('pt-BR', {
												weekday: 'long',
												year: 'numeric',
												month: 'long',
												day: 'numeric',
											})}
									</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Agendamentos */}
						<div className='space-y-3'>
							<h3 className='font-semibold text-lg flex items-center gap-2'>
								<Briefcase className='h-4 w-4' />
								Serviços Agendados ({createdAppointments.length})
							</h3>
							<div className='space-y-4 pl-6'>
								{createdAppointments.map((appointment, index: number) => (
									<div
										key={appointment.id || index}
										className='border rounded-lg p-4 space-y-3 bg-muted/30'
									>
										<div className='flex items-start justify-between'>
											<div className='space-y-2 flex-1'>
												<div>
													<Label className='text-sm text-muted-foreground'>
														Serviço
													</Label>
													<p className='font-semibold text-lg'>
														{appointment.service?.name || 'N/A'}
													</p>
												</div>
												<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
													<div>
														<Label className='text-sm text-muted-foreground'>
															Funcionário
														</Label>
														<p className='font-medium'>
															{appointment.employee?.name || 'N/A'}
														</p>
													</div>
													<div>
														<Label className='text-sm text-muted-foreground'>
															Horário
														</Label>
														<p className='font-medium flex items-center gap-1'>
															<Clock className='h-3 w-3' />
															{appointment.time || 'N/A'}
														</p>
													</div>
												</div>
												<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
													<div>
														<Label className='text-sm text-muted-foreground'>
															Duração
														</Label>
														<p className='font-medium'>
															{appointment.service?.duration
																? `${Math.floor(appointment.service.duration / 60)}h ${appointment.service.duration % 60}min`
																: 'N/A'}
														</p>
													</div>
													<div>
														<Label className='text-sm text-muted-foreground'>
															Valor
														</Label>
														<p className='font-semibold text-green-600'>
															{appointment.service?.price
																? formatCurrency(appointment.service.price)
																: 'N/A'}
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button onClick={handleCloseConfirmation} className='w-full'>
							Fechar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
