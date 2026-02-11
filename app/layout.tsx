/**
 * Layout raiz da aplicação (rota `/`).
 * Renderiza a estrutura HTML base, metadados SEO globais, fonte Kanit, Theme (Radix) e Toaster.
 * Todas as rotas são envolvidas por este layout.
 */
import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import './globals.css'
import { Theme } from '@radix-ui/themes'
import { Toaster } from '@/components/ui/sonner'
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
