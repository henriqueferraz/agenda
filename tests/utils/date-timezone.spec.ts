/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Testes para utils/date-timezone.ts.
 * Valida funções de data no timezone America/Sao_Paulo:
 * componentes, início/fim do dia, comparação, formatação e edge cases.
 *
 * @example
 * npx jest tests/utils/date-timezone.spec.ts
 */
import {
	getDateComponentsInSaoPaulo,
	createDateInSaoPaulo,
	startOfDayInSaoPaulo,
	endOfDayInSaoPaulo,
	compareDatesInSaoPaulo,
	isTodayInSaoPaulo,
	isPastInSaoPaulo,
	formatDateInSaoPaulo,
	formatDateTimeInSaoPaulo,
	getNowInSaoPaulo,
} from '@/utils/date-timezone'

describe('date-timezone', () => {
	describe('getDateComponentsInSaoPaulo', () => {
		test('extrai componentes corretos de data conhecida', () => {
			// 15 Jan 2026, 12:00 UTC = 09:00 São Paulo (UTC-3)
			const date = new Date('2026-01-15T12:00:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.year).toBe(2026)
			expect(comp.month).toBe(0) // Janeiro
			expect(comp.day).toBe(15)
			expect(comp.hours).toBe(9) // UTC-3
			expect(comp.minutes).toBe(0)
			expect(comp.seconds).toBe(0)
		})

		test('meia-noite UTC vira 21h do dia anterior em São Paulo', () => {
			// 15 Jan 2026, 00:00 UTC = 14 Jan 2026, 21:00 São Paulo
			const date = new Date('2026-01-15T00:00:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.day).toBe(14)
			expect(comp.hours).toBe(21)
		})

		test('02:59 UTC ainda é dia anterior em São Paulo', () => {
			// 15 Jan 2026, 02:59 UTC = 14 Jan 2026, 23:59 São Paulo
			const date = new Date('2026-01-15T02:59:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.day).toBe(14)
			expect(comp.hours).toBe(23)
			expect(comp.minutes).toBe(59)
		})

		test('03:00 UTC é meia-noite em São Paulo', () => {
			// 15 Jan 2026, 03:00 UTC = 15 Jan 2026, 00:00 São Paulo
			const date = new Date('2026-01-15T03:00:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.day).toBe(15)
			expect(comp.hours).toBe(0)
		})

		test('funciona na virada de ano', () => {
			// 01 Jan 2026, 03:00 UTC = 01 Jan 2026, 00:00 São Paulo
			const date = new Date('2026-01-01T03:00:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.year).toBe(2026)
			expect(comp.month).toBe(0)
			expect(comp.day).toBe(1)
			expect(comp.hours).toBe(0)
		})

		test('virada de ano UTC é 31 dez em São Paulo', () => {
			// 01 Jan 2026, 02:00 UTC = 31 Dez 2025, 23:00 São Paulo
			const date = new Date('2026-01-01T02:00:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.year).toBe(2025)
			expect(comp.month).toBe(11) // Dezembro
			expect(comp.day).toBe(31)
			expect(comp.hours).toBe(23)
		})

		test('funciona com data em fevereiro (ano bissexto)', () => {
			// 29 Fev 2028 é válido (ano bissexto)
			const date = new Date('2028-02-29T15:00:00Z')
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.year).toBe(2028)
			expect(comp.month).toBe(1)
			expect(comp.day).toBe(29)
			expect(comp.hours).toBe(12)
		})
	})

	describe('createDateInSaoPaulo', () => {
		test('cria data que quando lida em SP retorna componentes corretos', () => {
			const date = createDateInSaoPaulo(2026, 5, 15, 14, 30, 0)
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.year).toBe(2026)
			expect(comp.month).toBe(5) // Junho
			expect(comp.day).toBe(15)
			expect(comp.hours).toBe(14)
			expect(comp.minutes).toBe(30)
		})

		test('cria meia-noite corretamente', () => {
			const date = createDateInSaoPaulo(2026, 0, 1, 0, 0, 0)
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.hours).toBe(0)
			expect(comp.minutes).toBe(0)
			expect(comp.day).toBe(1)
		})

		test('cria 23:59:59 corretamente', () => {
			const date = createDateInSaoPaulo(2026, 0, 1, 23, 59, 59)
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.hours).toBe(23)
			expect(comp.minutes).toBe(59)
			expect(comp.seconds).toBe(59)
		})
	})

	describe('startOfDayInSaoPaulo', () => {
		test('retorna 00:00:00 do mesmo dia', () => {
			const date = createDateInSaoPaulo(2026, 2, 15, 14, 30, 45)
			const start = startOfDayInSaoPaulo(date)
			const comp = getDateComponentsInSaoPaulo(start)
			expect(comp.year).toBe(2026)
			expect(comp.month).toBe(2)
			expect(comp.day).toBe(15)
			expect(comp.hours).toBe(0)
			expect(comp.minutes).toBe(0)
			expect(comp.seconds).toBe(0)
		})

		test('preserva o dia correto com data UTC que cruza meia-noite', () => {
			// 15 Mar 2026, 01:00 UTC = 14 Mar 2026, 22:00 São Paulo
			const date = new Date('2026-03-15T01:00:00Z')
			const start = startOfDayInSaoPaulo(date)
			const comp = getDateComponentsInSaoPaulo(start)
			// Deve ser início do dia 14 (não do dia 15)
			expect(comp.day).toBe(14)
			expect(comp.hours).toBe(0)
		})

		test('meia-noite já é início do dia', () => {
			const date = createDateInSaoPaulo(2026, 6, 20, 0, 0, 0)
			const start = startOfDayInSaoPaulo(date)
			const comp = getDateComponentsInSaoPaulo(start)
			expect(comp.day).toBe(20)
			expect(comp.hours).toBe(0)
		})
	})

	describe('endOfDayInSaoPaulo', () => {
		test('retorna 23:59:59 do mesmo dia', () => {
			const date = createDateInSaoPaulo(2026, 2, 15, 10, 0, 0)
			const end = endOfDayInSaoPaulo(date)
			const comp = getDateComponentsInSaoPaulo(end)
			expect(comp.year).toBe(2026)
			expect(comp.month).toBe(2)
			expect(comp.day).toBe(15)
			expect(comp.hours).toBe(23)
			expect(comp.minutes).toBe(59)
			expect(comp.seconds).toBe(59)
		})

		test('fim do dia é posterior ao início do dia', () => {
			const date = createDateInSaoPaulo(2026, 0, 1, 12, 0, 0)
			const start = startOfDayInSaoPaulo(date)
			const end = endOfDayInSaoPaulo(date)
			expect(end.getTime()).toBeGreaterThan(start.getTime())
		})

		test('diferença entre início e fim é ~24h', () => {
			const date = createDateInSaoPaulo(2026, 5, 15, 12, 0, 0)
			const start = startOfDayInSaoPaulo(date)
			const end = endOfDayInSaoPaulo(date)
			const diffMs = end.getTime() - start.getTime()
			const diffHours = diffMs / (1000 * 60 * 60)
			// Deve ser ~23.999 horas (23:59:59.999)
			expect(diffHours).toBeGreaterThan(23.9)
			expect(diffHours).toBeLessThanOrEqual(24)
		})
	})

	describe('compareDatesInSaoPaulo', () => {
		test('mesma data retorna 0', () => {
			const d1 = createDateInSaoPaulo(2026, 5, 15, 10, 0, 0)
			const d2 = createDateInSaoPaulo(2026, 5, 15, 20, 0, 0)
			expect(compareDatesInSaoPaulo(d1, d2)).toBe(0)
		})

		test('data anterior retorna negativo', () => {
			const d1 = createDateInSaoPaulo(2026, 5, 14, 23, 59, 0)
			const d2 = createDateInSaoPaulo(2026, 5, 15, 0, 1, 0)
			expect(compareDatesInSaoPaulo(d1, d2)).toBeLessThan(0)
		})

		test('data posterior retorna positivo', () => {
			const d1 = createDateInSaoPaulo(2026, 5, 16, 0, 0, 0)
			const d2 = createDateInSaoPaulo(2026, 5, 15, 23, 59, 0)
			expect(compareDatesInSaoPaulo(d1, d2)).toBeGreaterThan(0)
		})

		test('datas em meses diferentes', () => {
			const jan = createDateInSaoPaulo(2026, 0, 31, 0, 0, 0)
			const fev = createDateInSaoPaulo(2026, 1, 1, 0, 0, 0)
			expect(compareDatesInSaoPaulo(jan, fev)).toBeLessThan(0)
		})

		test('datas em anos diferentes', () => {
			const dec = createDateInSaoPaulo(2025, 11, 31, 0, 0, 0)
			const jan = createDateInSaoPaulo(2026, 0, 1, 0, 0, 0)
			expect(compareDatesInSaoPaulo(dec, jan)).toBeLessThan(0)
		})
	})

	describe('isTodayInSaoPaulo', () => {
		test('retorna true para agora', () => {
			const now = new Date()
			expect(isTodayInSaoPaulo(now)).toBe(true)
		})

		test('retorna false para ontem', () => {
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			expect(isTodayInSaoPaulo(yesterday)).toBe(false)
		})

		test('retorna false para amanhã', () => {
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			expect(isTodayInSaoPaulo(tomorrow)).toBe(false)
		})
	})

	describe('isPastInSaoPaulo', () => {
		test('retorna true para data no passado', () => {
			const past = new Date(Date.now() - 86400000) // ontem
			expect(isPastInSaoPaulo(past)).toBe(true)
		})

		test('retorna false para data no futuro', () => {
			const future = new Date(Date.now() + 86400000) // amanhã
			expect(isPastInSaoPaulo(future)).toBe(false)
		})
	})

	describe('getNowInSaoPaulo', () => {
		test('retorna Date válida', () => {
			const now = getNowInSaoPaulo()
			expect(now).toBeInstanceOf(Date)
			expect(now.getTime()).toBeLessThanOrEqual(Date.now())
		})
	})

	describe('formatDateInSaoPaulo', () => {
		test('formata no padrão brasileiro dd/mm/yyyy', () => {
			const date = createDateInSaoPaulo(2026, 0, 15, 12, 0, 0)
			const formatted = formatDateInSaoPaulo(date)
			expect(formatted).toBe('15/01/2026')
		})

		test('formata com opções customizadas', () => {
			const date = createDateInSaoPaulo(2026, 0, 15, 12, 0, 0)
			const formatted = formatDateInSaoPaulo(date, {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			})
			expect(formatted).toContain('janeiro')
			expect(formatted).toContain('2026')
		})

		test('formata data de dezembro corretamente', () => {
			const date = createDateInSaoPaulo(2026, 11, 25, 12, 0, 0)
			const formatted = formatDateInSaoPaulo(date)
			expect(formatted).toBe('25/12/2026')
		})
	})

	describe('formatDateTimeInSaoPaulo', () => {
		test('formata data e hora no padrão brasileiro', () => {
			const date = createDateInSaoPaulo(2026, 0, 15, 14, 30, 0)
			const formatted = formatDateTimeInSaoPaulo(date)
			expect(formatted).toContain('15/01/2026')
			expect(formatted).toContain('14:30')
		})

		test('formata meia-noite corretamente', () => {
			const date = createDateInSaoPaulo(2026, 5, 1, 0, 0, 0)
			const formatted = formatDateTimeInSaoPaulo(date)
			expect(formatted).toContain('01/06/2026')
			expect(formatted).toContain('00:00')
		})
	})

	describe('edge cases - virada de mês/ano', () => {
		test('último dia de fevereiro em ano não bissexto', () => {
			const date = createDateInSaoPaulo(2026, 1, 28, 23, 59, 59)
			const comp = getDateComponentsInSaoPaulo(date)
			expect(comp.month).toBe(1)
			expect(comp.day).toBe(28)
		})

		test('virada de dezembro para janeiro', () => {
			const dec31 = createDateInSaoPaulo(2026, 11, 31, 23, 59, 0)
			const jan1 = createDateInSaoPaulo(2027, 0, 1, 0, 0, 0)
			expect(compareDatesInSaoPaulo(dec31, jan1)).toBeLessThan(0)
		})

		test('startOfDay e endOfDay no mesmo dia', () => {
			const date = createDateInSaoPaulo(2026, 2, 31, 12, 0, 0)
			const start = startOfDayInSaoPaulo(date)
			const end = endOfDayInSaoPaulo(date)
			const startComp = getDateComponentsInSaoPaulo(start)
			const endComp = getDateComponentsInSaoPaulo(end)
			expect(startComp.day).toBe(endComp.day)
			expect(startComp.month).toBe(endComp.month)
		})
	})
})
