import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// Conexoes lazy para os dois bancos
let _sqlPrimary: NeonQueryFunction<false, false> | null = null
let _sqlBackup: NeonQueryFunction<false, false> | null = null

// Controle de qual banco esta ativo
let useBackup = false
let lastErrorTime = 0
const ERROR_COOLDOWN = 60000 // 1 minuto antes de tentar o primario novamente

// Criar conexao com banco primario
function getPrimarySql(): NeonQueryFunction<false, false> | null {
  if (!process.env.DATABASE_URL) {
    return null
  }
  if (!_sqlPrimary) {
    _sqlPrimary = neon(process.env.DATABASE_URL)
  }
  return _sqlPrimary
}

// Criar conexao com banco backup
function getBackupSql(): NeonQueryFunction<false, false> | null {
  if (!process.env.DATABASE_URL_BACKUP) {
    return null
  }
  if (!_sqlBackup) {
    _sqlBackup = neon(process.env.DATABASE_URL_BACKUP)
  }
  return _sqlBackup
}

// Funcao que escolhe qual banco usar
function getActiveSql(): NeonQueryFunction<false, false> {
  const now = Date.now()
  
  // Se passou o cooldown, tenta o primario novamente
  if (useBackup && now - lastErrorTime > ERROR_COOLDOWN) {
    useBackup = false
  }
  
  // Tentar banco primario primeiro
  if (!useBackup) {
    const primary = getPrimarySql()
    if (primary) {
      return primary
    }
  }
  
  // Usar backup se disponivel
  const backup = getBackupSql()
  if (backup) {
    return backup
  }
  
  // Fallback para primario mesmo
  const primary = getPrimarySql()
  if (primary) {
    return primary
  }
  
  throw new Error('Nenhum banco de dados configurado. Configure DATABASE_URL ou DATABASE_URL_BACKUP')
}

// Funcao para marcar erro no banco primario
function markPrimaryError() {
  if (process.env.DATABASE_URL_BACKUP) {
    useBackup = true
    lastErrorTime = Date.now()
    console.log('[DB] Alternando para banco de dados backup')
  }
}

// Funcao wrapper que faz fallback automatico
async function executeWithFallback(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<any> {
  const activeSql = getActiveSql()
  
  try {
    const result = await activeSql(strings, ...values)
    return result
  } catch (error: any) {
    // Se erro de cota (402) ou conexao, tenta o backup
    const errorMessage = error?.message || ''
    const isQuotaError = errorMessage.includes('402') || 
                         errorMessage.includes('quota') || 
                         errorMessage.includes('exceeded') ||
                         errorMessage.includes('ECONNREFUSED') ||
                         errorMessage.includes('timeout')
    
    if (isQuotaError && !useBackup && process.env.DATABASE_URL_BACKUP) {
      markPrimaryError()
      
      // Tenta com o backup
      const backup = getBackupSql()
      if (backup) {
        try {
          console.log('[DB] Tentando query no banco backup...')
          return await backup(strings, ...values)
        } catch (backupError) {
          console.error('[DB] Erro no banco backup tambem:', backupError)
          throw backupError
        }
      }
    }
    
    throw error
  }
}

// Export sql com fallback automatico
export const sql = executeWithFallback as unknown as NeonQueryFunction<false, false>

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!(process.env.DATABASE_URL || process.env.DATABASE_URL_BACKUP)
}

// Retorna qual banco esta sendo usado
export function getActiveDatabaseInfo(): { primary: boolean; backup: boolean; active: string } {
  return {
    primary: !!process.env.DATABASE_URL,
    backup: !!process.env.DATABASE_URL_BACKUP,
    active: useBackup ? 'backup' : 'primary'
  }
}

// Funcao para forcar uso do backup
export function forceUseBackup() {
  if (process.env.DATABASE_URL_BACKUP) {
    useBackup = true
    lastErrorTime = Date.now()
  }
}

// Funcao para voltar ao primario
export function resetToPrimary() {
  useBackup = false
}

// Helper for transactions
export async function withTransaction<T>(
  callback: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
  const activeSql = getActiveSql()
  return callback(activeSql)
}

// Funcao para executar em AMBOS os bancos (para sincronizacao)
export async function executeOnBoth(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<{ primary: any; backup: any }> {
  const results = { primary: null as any, backup: null as any }
  
  const primary = getPrimarySql()
  const backup = getBackupSql()
  
  if (primary) {
    try {
      results.primary = await primary(strings, ...values)
    } catch (e) {
      console.error('[DB] Erro no banco primario:', e)
    }
  }
  
  if (backup) {
    try {
      results.backup = await backup(strings, ...values)
    } catch (e) {
      console.error('[DB] Erro no banco backup:', e)
    }
  }
  
  return results
}
