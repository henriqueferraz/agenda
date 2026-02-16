/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Modulo de envio de email - Mailtrap API e SMTP
 *
 * Envia emails transacionais (OTP, reset de senha, contato) usando
 * Mailtrap API como primario e SMTP via nodemailer como fallback.
 *
 * @example
 * import { sendEmail } from '@/lib/email'
 *
 * await sendEmail({
 *   to: 'user@email.com',
 *   subject: 'Codigo de verificacao',
 *   html: '<p>Seu codigo: 123456</p>',
 *   text: 'Seu codigo: 123456',
 * })
 */
import nodemailer from 'nodemailer'
import { MailtrapClient } from 'mailtrap'

/** Opcoes para envio de email */
interface SendEmailOptions {
	/** Email do destinatario */
	to: string
	/** Assunto do email */
	subject: string
	/** Corpo do email em HTML */
	html: string
	/** Corpo do email em texto puro (opcional) */
	text?: string
}

/**
 * Normaliza mensagens de erro para logs seguros.
 * @param error - Erro capturado (qualquer tipo)
 * @returns Mensagem legivel do erro
 */
const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message
	}
	try {
		return JSON.stringify(error)
	} catch {
		return 'Erro desconhecido'
	}
}

/**
 * Extrai nome e email de uma string no formato "Nome <email@ex.com>".
 * @param value - String com formato de remetente
 * @returns Objeto { name, email } ou null se vazio
 */
const parseFrom = (value?: string) => {
	if (!value) return null
	const match = value.match(/^(.*)<(.*)>$/)
	if (!match) {
		return { name: undefined, email: value.trim() }
	}
	return { name: match[1].trim(), email: match[2].trim() }
}

/**
 * Obtem dados do remetente para Mailtrap a partir das variaveis de ambiente.
 * Prioriza MAILTRAP_SENDER_EMAIL, fallback para SMTP_FROM.
 * @returns Objeto { email, name } do remetente ou null
 */
const getMailtrapSender = () => {
	const email = process.env.MAILTRAP_SENDER_EMAIL
	const name = process.env.MAILTRAP_SENDER_NAME
	if (email) {
		return { email, name: name || undefined }
	}
	const parsed = parseFrom(process.env.SMTP_FROM)
	if (parsed?.email) {
		return { email: parsed.email, name: parsed.name }
	}
	return null
}

/**
 * Cria um transporter SMTP via nodemailer.
 * @returns Transporter configurado para envio de emails
 * @throws Error se variaveis SMTP nao estiverem configuradas
 */
const getTransporter = () => {
	const host = process.env.SMTP_HOST
	const port = Number(process.env.SMTP_PORT || '587')
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	if (!host || !user || !pass) {
		throw new Error('Configuração SMTP incompleta')
	}
	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass },
	})
}

/**
 * Envia email via Mailtrap API (primario) ou SMTP (fallback).
 * Tenta Mailtrap se MAILTRAP_API_KEY estiver configurada, senao usa SMTP.
 * @param options - Opcoes de envio (to, subject, html, text)
 * @throws Error se nenhum provedor estiver configurado ou envio falhar
 * @example
 * await sendEmail({ to: 'user@email.com', subject: 'Ola', html: '<p>Oi</p>' })
 */
export const sendEmail = async ({
	to,
	subject,
	html,
	text,
}: SendEmailOptions) => {
	const mailtrapToken = process.env.MAILTRAP_API_KEY
	if (mailtrapToken) {
		const sender = getMailtrapSender()
		if (!sender) {
			throw new Error('MAILTRAP_SENDER_EMAIL não configurado')
		}
		const client = new MailtrapClient({ token: mailtrapToken })
		try {
			await client.send({
				from: {
					email: sender.email,
					name: sender.name,
				},
				to: [{ email: to }],
				subject,
				text,
				html,
			})
		} catch (error) {
			console.error('Erro Mailtrap ao enviar email:', getErrorMessage(error))
			throw new Error('Falha ao enviar email pela Mailtrap API')
		}
		return
	}
	const transporter = getTransporter()
	const from = process.env.SMTP_FROM || process.env.SMTP_USER
	if (!from) {
		throw new Error('SMTP_FROM não configurado')
	}
	await transporter.sendMail({
		from,
		to,
		subject,
		html,
		text,
	})
}
