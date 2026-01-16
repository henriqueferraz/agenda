/**
 * Hook - Use Auth
 *
 * Visao geral:
 * - Hook React para encapsular logica compartilhada.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Centralizar estado e efeitos reutilizaveis.
 * - Simplificar uso de logicas comuns no React.
 * - Manter consistencia entre chamadas.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/hooks/use-auth";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import { useEffect, useState } from 'react'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface AuthUser {
	id: string
	name: string | null
	email: string | null
	image: string | null
	be_called?: string | null
	token_called?: string | null
}
export const useAuth = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const [user, setUser] = useState<AuthUser | null>(null)
	const [loading, setLoading] = useState(true)
	useEffect(() => {
		const load = async () => {
			// Passo 1: validar entradas e garantir o contexto esperado.
			// Passo 2: preparar dados, estado e dependencias locais.
			// Passo 3: executar a acao principal do fluxo.
			// Passo 4: tratar retorno, erros e efeitos colaterais.
			setLoading(true)
			try {
				const res = await fetch('/api/auth/me')
				if (!res.ok) {
					setUser(null)
					return
				}
				const data = await res.json()
				setUser(data.user || null)
			} catch {
				setUser(null)
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])
	return { user, loading }
}
