/**
 * Layout - /
 *
 * Visao geral:
 * - Layout compartilhado para a rota `/`.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Fornecer estrutura base para a hierarquia de rotas.
 * - Centralizar wrappers e providers globais.
 * - Garantir consistência visual entre páginas e prevenir overflow horizontal.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/app/layout";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import './globals.css'
import { Theme } from '@radix-ui/themes'
import { Toaster } from '@/components/ui/sonner'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
const kanit = Kanit({
	variable: '--font-kanit',
	weight: ['400', '500', '600', '700', '800', '900'],
	subsets: ['latin'],
})
/**
 *  Layout Principal - Root Layout
 *
 * Este é o layout raiz da aplicação Next.js, responsável por:
 * - Configurar metadados SEO globais
 * - Carregar fontes (Kanit)
 * - Configurar provedores globais (Theme, Toaster)
 * - Estrutura HTML básica da aplicação
 */
export const metadata: Metadata = {
	title: {
		default: 'Agenda - Sistema de Agendamento Online',
		template: '%s | Agenda',
	},
	description:
		'Sistema completo de agendamento online para profissionais de serviços. Gerencie seus agendamentos, clientes e serviços de forma eficiente.',
	keywords: [
		'agendamento',
		'agenda',
		'profissionais',
		'serviços',
		'online',
		'gerenciamento',
	],
	authors: [{ name: 'Henrique Ferraz' }],
	creator: 'Henrique Ferraz',
	publisher: 'Agenda',
	robots: {
		index: true,
		follow: true,
		nocache: true,
	},
	icons: {
		icon: [
			{ url: '/favicon.ico', sizes: 'any' }
		],
	},
	openGraph: {
		title: 'Agenda - Sistema de Agendamento Online',
		description:
			'Sistema completo de agendamento online para profissionais de serviços. Gerencie seus agendamentos, clientes e serviços de forma eficiente.',
		url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
		siteName: 'Agenda',
		locale: 'pt-BR',
		type: 'website',
	},
}
export const RootLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode
}>) => {
	return (
		<html lang='pt-br' suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={`${kanit.variable} antialiased`}
			>
				<Theme>
					{children}
					<Toaster richColors duration={2000} />
				</Theme>
			</body>
		</html>
	)
}

export default RootLayout
