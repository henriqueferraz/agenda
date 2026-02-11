/**
 * API Route - /api/contact
 *
 * Visao geral:
 * - Handler HTTP para a rota `/api/contact`.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Valida payload com Zod.
 * 3. Envia email principal e copia.
 * 4. Retorna status e mensagem de resultado.
 *
 * Responsabilidades:
 * - Validar entradas do formulario de contato.
 * - Enviar email para o destinatario principal e copia.
 * - Retornar resposta consistente ao cliente.
 *
 * ## Exemplo de uso
 * ```typescript
 * const response = await fetch('/api/contact', {
 * 	method: 'POST',
 * 	headers: { 'Content-Type': 'application/json' },
 * 	body: JSON.stringify({ name: 'Joao', email: 'joao@email.com', message: 'Oi' }),
 * })
 * ```
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const contactSchema = z.object({
	name: z.string().min(2, 'Nome obrigatorio').max(120, 'Nome muito longo'),
	email: z.email('Email invalido'),
	message: z
		.string()
		.min(10, 'Mensagem muito curta')
		.max(2000, 'Mensagem muito longa'),
})

/**
 * Escapa caracteres especiais de HTML para prevenir XSS.
 * @param value - String a ser escapada
 * @returns String com caracteres especiais convertidos para entidades HTML
 */
const escapeHtml = (value: string): string => {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/**
 * Constroi o corpo HTML do email de contato com layout formatado.
 * @param data - Dados do formulario de contato (name, email, message)
 * @returns String HTML do corpo do email
 */
const buildHtml = (data: {
	name: string
	email: string
	message: string
}): string => {
	// Passo 1: escapar campos para evitar injecao de HTML.
	// Passo 2: montar o corpo do email com layout simples.
	const name = escapeHtml(data.name)
	const email = escapeHtml(data.email)
	const message = escapeHtml(data.message).replace(/\n/g, '<br />')

	return `
		<div style="font-family: Arial, sans-serif; line-height: 1.6;">
			<h2>Contato - Agenda</h2>
			<p><strong>Nome:</strong> ${name}</p>
			<p><strong>Email:</strong> ${email}</p>
			<p><strong>Mensagem:</strong></p>
			<p>${message}</p>
		</div>
	`
}

/**
 * Handler POST para receber mensagens do formulario de contato.
 * Valida os dados com Zod, envia email para o responsavel e uma copia.
 * @param request - Objeto Request com payload { name, email, message }
 * @returns NextResponse com mensagem de sucesso (200) ou erro (400/500)
 */
export const POST = async (request: Request): Promise<NextResponse> => {
	// Passo 1: validar o corpo da requisicao.
	// Passo 2: preparar o conteudo do email.
	// Passo 3: enviar para destinatario principal e copia.
	// Passo 4: retornar resposta de sucesso ou erro.
	try {
		const payload = await request.json()
		const parsed = contactSchema.safeParse(payload)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Dados invalidos' },
				{ status: 400 },
			)
		}

		const { name, email, message } = parsed.data
		const subject = `Contato - ${name}`
		const html = buildHtml({ name, email, message })
		const text = `Contato - Agenda\nNome: ${name}\nEmail: ${email}\n\n${message}`

		await sendEmail({
			to: 'henriqueferraz@ofnet.com.br',
			subject,
			html,
			text,
		})
		await sendEmail({
			to: 'carloshenriqueferraz@gmail.com',
			subject: `[Copia] ${subject}`,
			html,
			text,
		})

		return NextResponse.json({ message: 'Mensagem enviada com sucesso.' })
	} catch (error) {
		console.error('Erro ao enviar contato:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao enviar mensagem.' },
			{ status: 500 },
		)
	}
}
