/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-24
 * @modified 2026-02-24
 * @version 2026.02.24
 * @projectVersion 0.9.0
 */
/**
 * Página de debug temporária para verificar tokens de agendamento.
 * REMOVER após resolver o problema do 404.
 */
import { getCompanyByToken } from '../../[token]/_data-access/get-company-by-token'
import prisma from '@/lib/prisma'

// Força renderização dinâmica
export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface DebugPageProps {
	params: Promise<{
		token: string
	}>
}

export default async function DebugPage({ params }: DebugPageProps) {
	const { token: rawToken } = await params
	
	const decodedToken = decodeURIComponent(rawToken)
	const sanitizedToken = decodedToken.trim().toLowerCase()
	
	const company = await getCompanyByToken({ token: sanitizedToken })
	
	// Busca todos os tokens no banco para comparação
	const allTokens = await prisma.user.findMany({
		select: {
			id: true,
			be_called: true,
			token_called: true,
		},
		take: 10,
	})
	
	return (
		<div className='p-8 space-y-4'>
			<h1 className='text-2xl font-bold'>Debug Token</h1>
			<div className='space-y-2'>
				<p><strong>Raw Token:</strong> {rawToken}</p>
				<p><strong>Decoded Token:</strong> {decodedToken}</p>
				<p><strong>Sanitized Token:</strong> {sanitizedToken}</p>
				<p><strong>Token Length:</strong> {sanitizedToken.length}</p>
				<p><strong>Company Found:</strong> {company ? 'SIM' : 'NÃO'}</p>
				{company && (
					<div className='mt-4 p-4 bg-green-100 rounded'>
						<p><strong>ID:</strong> {company.id}</p>
						<p><strong>Nome:</strong> {company.be_called}</p>
						<p><strong>Token no DB:</strong> {company.token_called}</p>
					</div>
				)}
				<div className='mt-4'>
					<h2 className='font-bold'>Primeiros 10 tokens no banco:</h2>
					<ul className='list-disc list-inside'>
						{allTokens.map((u) => (
							<li key={u.id}>
								{u.be_called} → {u.token_called || 'null'}
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}
