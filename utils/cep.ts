/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Busca de endereço por CEP (ViaCEP com fallback BrasilAPI) e formatação de CEP.
 * Define tipos AddressData e CepResponse e exporta searchCep e formatCepDisplay.
 *
 * @example
 * import { searchCep, formatCepDisplay } from '@/utils/cep'
 * const result = await searchCep('01310-100')
 * if (result.success) console.log(result.data?.logradouro)
 */
// Interface para os dados de endereço retornados pelas APIs
export interface AddressData {
	/** CEP formatado */
	cep: string
	/** Logradouro (rua, avenida, etc.) */
	logradouro: string
	/** Complemento do endereço */
	complemento: string
	/** Bairro do endereço */
	bairro: string
	/** Cidade/município */
	localidade: string
	/** Estado (UF) */
	uf: string
	/** Código IBGE do município */
	ibge?: string
	/** Código GIA */
	gia?: string
	/** Código DDD */
	ddd?: string
	/** Indica se o CEP é de zona rural */
	siafi?: string
}
// Interface para resposta padronizada das funções de busca
export interface CepResponse {
	/** Indica se a busca foi bem-sucedida */
	success: boolean
	/** Dados do endereço (se sucesso) */
	data?: AddressData
	/** Mensagem de erro (se falhou) */
	error?: string
}
const DEFAULT_TIMEOUT_MS = 7000
type FetchOptions = {
	signal?: AbortSignal
}
const createTimeoutSignal = (timeoutMs: number, signal?: AbortSignal) => {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
	const onAbort = () => controller.abort()
	if (signal) {
		if (signal.aborted) {
			controller.abort()
		} else {
			signal.addEventListener('abort', onAbort, { once: true })
		}
	}
	const cleanup = () => {
		clearTimeout(timeoutId)
		if (signal) {
			signal.removeEventListener('abort', onAbort)
		}
	}
	return { signal: controller.signal, cleanup }
}
/**
 * Busca endereço por CEP usando a API ViaCEP
 *
 * @param cep - CEP para buscar (apenas números ou formatado)
 * @param options - Opcoes de requisicao (abort/timeout)
 * @returns Promise com dados do endereço ou erro
 */
const searchViaCep = async (
	cep: string,
	options: FetchOptions = {},
): Promise<CepResponse> => {
	try {
		// Remove caracteres não numéricos
		const cleanCep = cep.replace(/\D/g, '')
		// Valida se o CEP tem 8 dígitos
		if (cleanCep.length !== 8) {
			return {
				success: false,
				error: 'CEP deve conter 8 dígitos.',
			}
		}
		const { signal, cleanup } = createTimeoutSignal(
			DEFAULT_TIMEOUT_MS,
			options.signal,
		)
		const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
			signal,
		}).finally(cleanup)
		// Verifica se a resposta foi bem-sucedida
		if (!response.ok) {
			return {
				success: false,
				error: `Erro na API ViaCEP: ${response.status}`,
			}
		}
		const data: AddressData & {
			erro?: boolean
		} = await response.json()
		// Verifica se o ViaCEP retornou erro
		if (data.erro) {
			return {
				success: false,
				error: 'CEP não encontrado na base ViaCEP.',
			}
		}
		return {
			success: true,
			data: data,
		}
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			return {
				success: false,
				error: 'Timeout ao consultar ViaCEP.',
			}
		}
		return {
			success: false,
			error: `Erro ao consultar ViaCEP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
		}
	}
}
/**
 * Busca endereço por CEP usando a API BrasilAPI
 *
 * @param cep - CEP para buscar (apenas números ou formatado)
 * @param options - Opcoes de requisicao (abort/timeout)
 * @returns Promise com dados do endereço ou erro
 */
const searchBrasilApi = async (
	cep: string,
	options: FetchOptions = {},
): Promise<CepResponse> => {
	try {
		// Remove caracteres não numéricos
		const cleanCep = cep.replace(/\D/g, '')
		// Valida se o CEP tem 8 dígitos
		if (cleanCep.length !== 8) {
			return {
				success: false,
				error: 'CEP deve conter 8 dígitos.',
			}
		}
		const { signal, cleanup } = createTimeoutSignal(
			DEFAULT_TIMEOUT_MS,
			options.signal,
		)
		const response = await fetch(
			`https://brasilapi.com.br/api/cep/v1/${cleanCep}`,
			{
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
				signal,
			},
		).finally(cleanup)
		// Verifica se a resposta foi bem-sucedida
		if (!response.ok) {
			if (response.status === 404) {
				return {
					success: false,
					error: 'CEP não encontrado na base BrasilAPI.',
				}
			}
			return {
				success: false,
				error: `Erro na API BrasilAPI: ${response.status}`,
			}
		}
		const data = await response.json()
		// Converte o formato BrasilAPI para o formato ViaCEP (compatibilidade)
		const convertedData: AddressData = {
			cep: data.cep,
			logradouro: data.street,
			complemento: data.complement || '',
			bairro: data.neighborhood,
			localidade: data.city,
			uf: data.state,
			ibge: data.ibge,
			gia: data.gia,
			ddd: data.ddd,
			siafi: data.siafi,
		}
		return {
			success: true,
			data: convertedData,
		}
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			return {
				success: false,
				error: 'Timeout ao consultar BrasilAPI.',
			}
		}
		return {
			success: false,
			error: `Erro ao consultar BrasilAPI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
		}
	}
}
/**
 * Busca endereço por CEP usando ViaCEP primeiro, depois BrasilAPI como fallback
 *
 * Esta função tenta buscar o endereço usando a API ViaCEP primeiro.
 * Se não encontrar ou houver erro, tenta usar a API BrasilAPI como alternativa.
 *
 * @param cep - CEP para buscar (pode conter formatação)
 * @returns Promise com dados do endereço ou erro
 *
 * @example
 * ```typescript
 * const result = await searchCep("01310-100");
 * if (result.success) {
 *   console.log("Endereço encontrado:", result.data);
 * } else {
 *   console.error("Erro:", result.error);
 * }
 * ```
 */
export const searchCep = async (
	cep: string,
	options: FetchOptions = {},
): Promise<CepResponse> => {
	// Remove caracteres não numéricos e espaços
	const cleanCep = cep.replace(/\D/g, '').trim()
	// Validação básica do CEP
	if (!cleanCep || cleanCep.length !== 8) {
		return {
			success: false,
			error: 'CEP deve conter exatamente 8 dígitos.',
		}
	}
	// Tenta buscar no ViaCEP primeiro
	const viaCepResult = await searchViaCep(cleanCep, options)
	if (viaCepResult.success) {
		return viaCepResult
	}
	// Se ViaCEP falhou, tenta BrasilAPI
	console.warn('ViaCEP falhou, tentando BrasilAPI:', viaCepResult.error)
	const brasilApiResult = await searchBrasilApi(cleanCep, options)
	if (brasilApiResult.success) {
		return brasilApiResult
	}
	// Se ambas as APIs falharam, retorna erro
	return {
		success: false,
		error: `CEP não encontrado em nenhuma base de dados. ViaCEP: ${viaCepResult.error}, BrasilAPI: ${brasilApiResult.error}`,
	}
}
/**
 * Formata CEP para o padrão brasileiro (XXXXX-XXX)
 *
 * @param cep - CEP para formatar (apenas números)
 * @returns CEP formatado ou string vazia se inválido
 *
 * @example
 * ```typescript
 * formatCepDisplay("01310100"); // "01310-100"
 * formatCepDisplay("01310"); // ""
 * ```
 */
export const formatCepDisplay = (cep: string): string => {
	// Remove caracteres não numéricos
	const cleanCep = cep.replace(/\D/g, '')
	// Só formata se tiver exatamente 8 dígitos
	if (cleanCep.length === 8) {
		return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`
	}
	return cleanCep
}
