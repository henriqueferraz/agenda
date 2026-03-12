/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Configuração do Next.js para o projeto (App Router).
 * Exporta o objeto nextConfig usado pelo CLI e pela build.
 */
import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
	/* config options here */
	async rewrites() {
		return [
			{
				source: '/ingest/static/:path*',
				destination: 'https://us-assets.i.posthog.com/static/:path*',
			},
			{
				source: '/ingest/:path*',
				destination: 'https://us.i.posthog.com/:path*',
			},
		]
	},
	skipTrailingSlashRedirect: true,
}
export default nextConfig
