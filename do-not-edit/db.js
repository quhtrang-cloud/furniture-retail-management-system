import 'dotenv/config'
import pg from 'pg'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

export const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function getDatabaseConfig() {
  const database = process.env.DB_NAME
  if (!database || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(database)) {
    throw new Error('DB_NAME must be a valid PostgreSQL identifier')
  }

  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database,
    adminDatabase: process.env.DB_ADMIN_DATABASE || 'postgres',
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
  }
}

export async function readSqlFile(filename) {
  return readFile(join(__dirname, '../db', filename), 'utf8')
}
