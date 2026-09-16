import { Client, getDatabaseConfig } from './db.js'

async function cleanupDatabase() {
  const { database, adminDatabase, ...baseConfig } = getDatabaseConfig()
  const adminClient = new Client({ ...baseConfig, database: adminDatabase })

  try {
    await adminClient.connect()
    await adminClient.query(`DROP DATABASE IF EXISTS "${database}"`)
    console.log(`Database '${database}' dropped successfully`)
  } catch (err) {
    console.error('Error cleaning up database:', err.message)
    process.exitCode = 1
  } finally {
    await adminClient.end()
  }
}

cleanupDatabase()
