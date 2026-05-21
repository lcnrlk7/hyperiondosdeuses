import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// URL do banco de dados principal
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_To8gys4jEZpb@ep-snowy-pine-ancq443l-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'

// Conexao lazy
let _sql: NeonQueryFunction<false, false> | null = null

// Criar conexao
function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    _sql = neon(DATABASE_URL)
  }
  return _sql
}

// Export sql
export const sql = getSql() as NeonQueryFunction<false, false>

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!DATABASE_URL
}

// Helper for transactions
export async function withTransaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  return callback(getSql())
}
