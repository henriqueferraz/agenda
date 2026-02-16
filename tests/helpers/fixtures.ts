/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Teste - Fixtures
 *
 * Visao geral:
 * - Casos de teste para Fixtures.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Validar contratos e comportamento esperado.
 * - Cobrir cenarios de sucesso e falha.
 * - Proteger contra regressao.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/tests/helpers/fixtures";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export const fixtures = {
	user: {
		id: 'usr_1',
		name: 'Henrique',
		email: 'henrique@teste.com',
		password_hash: 'hash',
		emailVerified: new Date(),
		status: true,
	},
	service: {
		id: 'srv_1',
		name: 'Corte',
		price: 3000,
		duration: 30,
		status: true,
		UserId: 'usr_1',
		createdAt: new Date(),
	},
	employee: {
		id: 'emp_1',
		name: 'Funcionario',
		email: 'func@teste.com',
		phone: '(11) 99999-9999',
		function: 'Barbeiro',
		status: true,
		UserId: 'usr_1',
		createdAt: new Date(),
	},
	appointment: {
		id: 'apt_1',
		name: 'Cliente',
		email: 'cliente@teste.com',
		phone: '(11) 99999-9999',
		appointmentDate: new Date(),
		time: '10:00',
		userId: 'usr_1',
		serviceId: 'srv_1',
		employeeId: 'emp_1',
		createdAt: new Date(),
	},
}
