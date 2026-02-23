/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-02-20
 * @modified 2026-02-20
 * @version 2026.02.20
 * @projectVersion 0.9.0
 */
/**
 * Lista canônica de atividades permitidas no sistema — fonte única de verdade.
 * Importada pelo formulário de atividade (client) e pela server action de
 * atualização (server) para garantir consistência entre validação Zod,
 * UI (Select) e persistência.
 *
 * @example
 * import { ALLOWED_ACTIVITIES } from '@/lib/constants/activities'
 * console.log(ALLOWED_ACTIVITIES) // ['Barbearia', 'Cabelereiro', ...]
 */

/** Atividades permitidas no sistema, em ordem alfabética com "Outros" ao final. */
export const ALLOWED_ACTIVITIES = [
	'Barbearia',
	'Cabelereiro',
	'Clínica Veterinária',
	'Consultório Médico',
	'Consultório Odontológico',
	'Consultório Veterinário',
	'Design de Sobrancelhas',
	'Manicure',
	'Maquiagem',
	'Petshop',
	'Outros',
] as const
