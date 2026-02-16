/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
/**
 * Cliente Prisma singleton para o projeto: usa adaptador PostgreSQL e, em desenvolvimento,
 * reutiliza a instância em global para evitar múltiplos clientes no hot reload.
 *
 * @example
 * import prisma from '@/lib/prisma'
 * const users = await prisma.user.findMany()
 */
import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
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
