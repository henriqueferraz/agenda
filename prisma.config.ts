/**
 * @project Agenda
 * @author Henrique Ferraz
 * @created 2026-01-16
 * @modified 2026-02-16
 * @version 2026.02.16
 * @projectVersion 0.9.0
 */
import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: '.env.local' })
config({ path: '.env' })

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: process.env.DATABASE_URL || '',
	},
})
