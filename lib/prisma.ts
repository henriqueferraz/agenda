/**
 * Utilitario - Prisma
 *
 * Visao geral:
 * - Funcoes de suporte para Prisma.
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
 * import * as modulo from "@/lib/prisma";
 *
 * // Uso conforme o fluxo da aplicacao.
 * void modulo;
 * ```
 */
import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
/*
 * Fluxo interno do modulo:
 * 1. Inicializa dependencias e configuracoes locais.
 * 2. Define tipos, constantes e validacoes necessarias.
 * 3. Executa a logica principal (acoes, consultas ou UI).
 * 4. Trata retornos, estados e exibicao final.
 */
// Obtém a string de conexão do banco de dados
const connectionString = `${process.env.DATABASE_URL}`
let prisma: PrismaClient
// Cria o adaptador PostgreSQL para melhor performance
const adapter = new PrismaPg({ connectionString })
if (process.env.NODE_ENV === 'production') {
	// Produção: nova instância por requisição
	prisma = new PrismaClient({
		adapter,
	})
} else {
	// Desenvolvimento: singleton para hot reload
	const globalWithPrisma = global as typeof globalThis & {
		prisma: PrismaClient
	}
	if (!globalWithPrisma.prisma) {
		globalWithPrisma.prisma = new PrismaClient({
			adapter,
		})
	}
	prisma = globalWithPrisma.prisma
}
// Exportação do cliente configurado
export default prisma
