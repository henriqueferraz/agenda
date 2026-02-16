/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes unitários para lib/email.ts.
 * Valida envio via SMTP (nodemailer) e Mailtrap API.
 *
 * @example
 * npx jest tests/lib/email.spec.ts
 */
import { sendEmail } from '@/lib/email'

const mockSendMail = jest.fn()
jest.mock('nodemailer', () => ({
	__esModule: true,
	default: {
		createTransport: () => ({
			sendMail: mockSendMail,
		}),
	},
}))

const mockMailtrapSend = jest.fn()
jest.mock('mailtrap', () => ({
	MailtrapClient: jest.fn().mockImplementation(() => ({
		send: mockMailtrapSend,
	})),
}))

describe('email', () => {
	const opts = {
		to: 'user@example.com',
		subject: 'Test',
		html: '<p>Test</p>',
		text: 'Test',
	}

	beforeEach(() => {
		jest.clearAllMocks()
		delete process.env.MAILTRAP_API_KEY
		delete process.env.MAILTRAP_SENDER_EMAIL
		delete process.env.SMTP_HOST
		delete process.env.SMTP_USER
		delete process.env.SMTP_PASS
		delete process.env.SMTP_FROM
	})

	test('when MAILTRAP_API_KEY is not set, uses nodemailer (SMTP path)', async () => {
		process.env.SMTP_HOST = 'smtp.example.com'
		process.env.SMTP_USER = 'user'
		process.env.SMTP_PASS = 'pass'
		process.env.SMTP_FROM = 'from@example.com'
		mockSendMail.mockResolvedValue({})

		await sendEmail(opts)

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: opts.to,
				subject: opts.subject,
				html: opts.html,
				text: opts.text,
			}),
		)
		expect(mockMailtrapSend).not.toHaveBeenCalled()
	})

	test('when MAILTRAP_API_KEY is set, uses MailtrapClient', async () => {
		process.env.MAILTRAP_API_KEY = 'mailtrap-token'
		process.env.MAILTRAP_SENDER_EMAIL = 'sender@example.com'
		mockMailtrapSend.mockResolvedValue(undefined)

		await sendEmail(opts)

		expect(mockMailtrapSend).toHaveBeenCalledWith(
			expect.objectContaining({
				to: [{ email: opts.to }],
				subject: opts.subject,
				html: opts.html,
				text: opts.text,
			}),
		)
		expect(mockSendMail).not.toHaveBeenCalled()
	})

	test('throws when no provider configured (no SMTP_HOST, no MAILTRAP_API_KEY)', async () => {
		await expect(sendEmail(opts)).rejects.toThrow()
		expect(mockSendMail).not.toHaveBeenCalled()
		expect(mockMailtrapSend).not.toHaveBeenCalled()
	})
})
