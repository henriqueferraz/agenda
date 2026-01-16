/**
 * Hook - Use Mobile
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
 * import * as modulo from "@/hooks/use-mobile";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
import * as React from 'react'
// Breakpoint padrão para dispositivos móveis (Tailwind CSS)
const MOBILE_BREAKPOINT = 768
export const useIsMobile = (): boolean => {
	// Estado inicial undefined para evitar hydration mismatch
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
	React.useEffect(() => {
		// Media query para detectar telas menores que o breakpoint
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
		// Função para atualizar o estado quando a tela muda
		const onChange = () => {
			// Passo 1: validar entradas e garantir o contexto esperado.
			// Passo 2: preparar dados, estado e dependencias locais.
			// Passo 3: executar a acao principal do fluxo.
			// Passo 4: tratar retorno, erros e efeitos colaterais.
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		}
		// Adiciona listener para mudanças na tela
		mql.addEventListener('change', onChange)
		// Define estado inicial
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		// Cleanup: remove listener
		return () => mql.removeEventListener('change', onChange)
	}, [])
	// Converte undefined para false durante SSR/hydration
	return !!isMobile
}
