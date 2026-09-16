import { Client, getDatabaseConfig, readSqlFile } from './db.js'

async function setupDatabase() {
  const { database, adminDatabase, ...baseConfig } = getDatabaseConfig()
  const adminClient = new Client({ ...baseConfig, database: adminDatabase })
  let dbClient

  try {
    await adminClient.connect()
    await adminClient.query(`CREATE DATABASE "${database}"`)
    console.log(`Database '${database}' created successfully`)

    dbClient = new Client({ ...baseConfig, database })
    await dbClient.connect()
    await dbClient.query(await readSqlFile('create-tables.sql'))
    await dbClient.query(await readSqlFile('seed-data.sql'))
    console.log('Tables and simulated seed data created successfully')
  } catch (err) {
    console.error('Error setting up database:', err.message)
    process.exitCode = 1
  } finally {
    if (dbClient) await dbClient.end()
    await adminClient.end()
  }
}

setupDatabase()
