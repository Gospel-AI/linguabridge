import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const useLocalDb = process.env.USE_LOCAL_DB === 'true'
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/linguabridge'

// PostgreSQL connection pool for local development
export const pool = new Pool({
  connectionString: databaseUrl,
})

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connected:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Helper function to execute queries
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

// Export useLocalDb for conditional logic
export { useLocalDb }
