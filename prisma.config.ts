/**
 * Configuracao - Prisma.config
 *
 * Visao geral:
 * - Configuracao do Prisma.config para o projeto.
 *
 * Fluxo de execucao:
 * 1. Carrega dependencias e tipos usados pelo modulo.
 * 2. Define constantes, schemas e helpers locais.
 * 3. Exporta a API principal para consumo pelo app.
 *
 * Responsabilidades:
 * - Centralizar ajustes de ambiente e build.
 * - Padronizar defaults e overrides.
 * - Garantir consistencia entre ambientes.
 *
 * ## Exemplo de uso
 * ```typescript
 * import * as modulo from "@/prisma.config";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
export default defineConfig({
	// Caminho para o arquivo de schema do Prisma
	schema: 'prisma/schema.prisma',
	// Configuração das migrações
	migrations: {
		path: 'prisma/migrations', // Diretório das migrações
	},
	// Configuração da fonte de dados (banco)
	datasource: {
		url: env('DATABASE_URL'), // String de conexão PostgreSQL
	},
})
