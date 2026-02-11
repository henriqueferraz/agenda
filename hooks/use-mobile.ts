/**
 * Hook React que detecta se a viewport é mobile (largura < 768px) via matchMedia.
 * Evita hydration mismatch usando estado inicial undefined; útil para layout responsivo (Tailwind breakpoint sm).
 *
 * @example
 * const isMobile = useIsMobile()
 * return isMobile ? <MobileNav /> : <DesktopNav />
 */
import * as React from 'react'
// Breakpoint padrão para dispositivos móveis (Tailwind CSS)
const MOBILE_BREAKPOINT = 768
/**
 * Hook que detecta se o dispositivo e mobile com base no breakpoint de 768px.
 * Utiliza window.matchMedia para escutar mudancas de tamanho da tela.
 * @returns true se a largura da tela for menor que 768px, false caso contrario
 * @example
 * const isMobile = useIsMobile()
 * return isMobile ? <MobileLayout /> : <DesktopLayout />
 */
export const useIsMobile = (): boolean => {
	// Estado inicial undefined para evitar hydration mismatch
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
	React.useEffect(() => {
		// Media query para detectar telas menores que o breakpoint
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
		// Função para atualizar o estado quando a tela muda
		const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
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
