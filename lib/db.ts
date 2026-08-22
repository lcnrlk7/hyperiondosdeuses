import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// URL do banco de dados principal. Falha fechada: credenciais nunca ficam no codigo.
const DATABASE_URL = process.env.DATABASE_URL

// Conexao lazy: a ausencia da variavel falha fechada no primeiro acesso ao
// banco, sem embutir credenciais e sem quebrar a coleta estatica do Next.js.
let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL nao configurada')
  }
  if (!_sql) {
    _sql = neon(DATABASE_URL)
  }
  return _sql
}

// Proxy preserva a API tagged-template existente e inicializa a conexao apenas
// quando uma consulta realmente e executada.
export const sql = new Proxy((() => undefined) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, thisArg, argArray) {
    return Reflect.apply(getSql() as unknown as (...args: unknown[]) => unknown, thisArg, argArray)
  },
})

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
