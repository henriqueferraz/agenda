/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Rota POST /api/contact: recebe mensagens do formulario de contato,
 * aplica rate limiting por IP, valida payload com Zod, escapa HTML
 * e envia email para destinatario principal e copia.
 *
 * @example
 * const response = await fetch('/api/contact', {
 * 	method: 'POST',
 * 	headers: { 'Content-Type': 'application/json' },
 * 	body: JSON.stringify({ name: 'Joao', email: 'joao@email.com', message: 'Oi' }),
 * })
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'
import { checkIpRateLimit } from '@/lib/rate-limit'

/** Schema de validacao do payload de contato */
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
 * Aplica rate limiting por IP, valida com Zod e envia emails.
 *
 * @param request - Objeto NextRequest com payload { name, email, message }
 * @returns NextResponse com mensagem de sucesso (200) ou erro (400/429/500)
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
	try {
		// Rate limiting por IP para evitar spam
		const ip =
			request.headers.get('x-real-ip') ||
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			'unknown'
		const rateLimit = await checkIpRateLimit(ip)
		if (!rateLimit.allowed) {
			return NextResponse.json(
				{
					error: 'Muitas requisições. Tente novamente mais tarde.',
					blockedUntil: rateLimit.blockedUntil,
				},
				{ status: 429 },
			)
		}

		// Valida o corpo da requisicao
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

		// Destinatarios configurados via variaveis de ambiente
		const primaryEmail = process.env.CONTACT_EMAIL_TO
		const copyEmail = process.env.CONTACT_EMAIL_CC

		if (!primaryEmail) {
			console.error('CONTACT_EMAIL_TO não está configurado')
			return NextResponse.json(
				{ error: 'Erro interno ao enviar mensagem.' },
				{ status: 500 },
			)
		}

		await sendEmail({ to: primaryEmail, subject, html, text })

		if (copyEmail) {
			await sendEmail({
				to: copyEmail,
				subject: `[Copia] ${subject}`,
				html,
				text,
			})
		}

		return NextResponse.json({ message: 'Mensagem enviada com sucesso.' })
	} catch (error) {
		console.error('Erro ao enviar contato:', error)
		return NextResponse.json(
			{ error: 'Erro interno ao enviar mensagem.' },
			{ status: 500 },
		)
	}
}
