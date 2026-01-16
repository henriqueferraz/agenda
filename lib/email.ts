/**
 * Utilitario - Email
 *
 * Visao geral:
 * - Funcoes de suporte para Email.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Fornecer utilitarios de dominio ou infraestrutura.
 * - Padronizar formatos e regras reutilizaveis.
 * - Evitar duplicacao de logica.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/lib/email";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import nodemailer from 'nodemailer'
import { MailtrapClient } from 'mailtrap'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
interface SendEmailOptions {
	to: string
	subject: string
	html: string
	text?: string
}
const parseFrom = (value?: string) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	if (!value) return null
	const match = value.match(/^(.*)<(.*)>$/)
	if (!match) {
		return { name: undefined, email: value.trim() }
	}
	return { name: match[1].trim(), email: match[2].trim() }
}
const getMailtrapSender = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
const getTransporter = () => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
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
export const sendEmail = async ({
	to,
	subject,
	html,
	text,
}: SendEmailOptions) => {
	// Passo 1: validar entradas e garantir o contexto esperado.
	// Passo 2: preparar dados, estado e dependencias locais.
	// Passo 3: executar a acao principal do fluxo.
	// Passo 4: tratar retorno, erros e efeitos colaterais.
	const mailtrapToken = process.env.MAILTRAP_API_KEY
	if (mailtrapToken) {
		const sender = getMailtrapSender()
		if (!sender) {
			throw new Error('MAILTRAP_SENDER_EMAIL não configurado')
		}
		const client = new MailtrapClient({ token: mailtrapToken })
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
