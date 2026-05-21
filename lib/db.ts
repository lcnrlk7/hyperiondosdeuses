import { neon, NeonQueryFunction } from '@neondatabase/serverless'

// URLs dos bancos - backup tem URL hardcoded como fallback
const PRIMARY_URL = process.env.DATABASE_URL || ''
const BACKUP_URL = process.env.DATABASE_URL_BACKUP || 'postgresql://neondb_owner:npg_BhL2fqZ7VjEo@ep-cold-voice-acl18zxi-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'

// Conexoes lazy para os dois bancos
let _sqlPrimary: NeonQueryFunction<false, false> | null = null
let _sqlBackup: NeonQueryFunction<false, false> | null = null

// Controle de qual banco esta ativo
let useBackup = false
let lastErrorTime = 0
const ERROR_COOLDOWN = 60000 // 1 minuto antes de tentar o primario novamente

// Criar conexao com banco primario
function getPrimarySql(): NeonQueryFunction<false, false> | null {
  if (!PRIMARY_URL) {
    return null
  }
  if (!_sqlPrimary) {
    _sqlPrimary = neon(PRIMARY_URL)
  }
  return _sqlPrimary
}

// Criar conexao com banco backup (sempre disponivel)
function getBackupSql(): NeonQueryFunction<false, false> {
  if (!_sqlBackup) {
    _sqlBackup = neon(BACKUP_URL)
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
  
  // Usar backup (sempre disponivel)
  return getBackupSql()
}

// Funcao para marcar erro no banco primario
function markPrimaryError() {
  useBackup = true
  lastErrorTime = Date.now()
  console.log('[DB] Alternando para banco de dados backup')
}

// Verificar se e uma operacao de escrita
function isWriteOperation(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return lowerQuery.includes('insert') || 
         lowerQuery.includes('update') || 
         lowerQuery.includes('delete')
}

// Sincronizar operacao de escrita para o outro banco (em background)
async function syncToOtherDb(
  strings: TemplateStringsArray,
  values: unknown[],
  targetDb: NeonQueryFunction<false, false>
): Promise<void> {
  try {
    await targetDb(strings, ...values)
  } catch (e: any) {
    // Ignorar erros de duplicata ou constraint
    const msg = e?.message || ''
    if (!msg.includes('duplicate') && !msg.includes('already exists') && !msg.includes('violates')) {
      console.error('[DB] Erro ao sincronizar:', msg.substring(0, 100))
    }
  }
}

// Funcao wrapper que faz fallback automatico E sincroniza escritas
async function executeWithFallback(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<any> {
  const activeSql = getActiveSql()
  const queryStr = strings.join('?')
  const isWrite = isWriteOperation(queryStr)
  
  try {
    const result = await activeSql(strings, ...values)
    
    // Se for escrita, sincroniza para o outro banco em background
    if (isWrite) {
      const otherDb = useBackup ? getPrimarySql() : getBackupSql()
      if (otherDb && otherDb !== activeSql) {
        // Nao espera a sincronizacao terminar
        syncToOtherDb(strings, values, otherDb).catch(() => {})
      }
    }
    
    return result
  } catch (error: any) {
    // Se erro de cota (402) ou conexao, tenta o backup
    const errorMessage = error?.message || ''
    const isQuotaError = errorMessage.includes('402') || 
                         errorMessage.includes('quota') || 
                         errorMessage.includes('exceeded') ||
                         errorMessage.includes('ECONNREFUSED') ||
                         errorMessage.includes('timeout')
    
    if (isQuotaError && !useBackup) {
      markPrimaryError()
      
      // Tenta com o backup
      const backup = getBackupSql()
      try {
        console.log('[DB] Tentando query no banco backup...')
        const result = await backup(strings, ...values)
        return result
      } catch (backupError) {
        console.error('[DB] Erro no banco backup tambem:', backupError)
        throw backupError
      }
    }
    
    throw error
  }
}

// Export sql com fallback automatico
export const sql = executeWithFallback as unknown as NeonQueryFunction<false, false>

// Helper function to check if database is configured
export function isDatabaseConfigured(): boolean {
  return true // Backup sempre disponivel
}

// Retorna qual banco esta sendo usado
export function getActiveDatabaseInfo(): { primary: boolean; backup: boolean; active: string } {
  return {
    primary: !!PRIMARY_URL,
    backup: true,
    active: useBackup ? 'backup' : (PRIMARY_URL ? 'primary' : 'backup')
  }
}

// Funcao para forcar uso do backup
export function forceUseBackup() {
  useBackup = true
  lastErrorTime = Date.now()
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
  
  try {
    results.backup = await backup(strings, ...values)
  } catch (e) {
    console.error('[DB] Erro no banco backup:', e)
  }
  
  return results
}

// Funcao para sincronizar TODOS os dados entre os bancos
export async function fullDatabaseSync(): Promise<{ success: boolean; message: string; synced: number }> {
  const primary = getPrimarySql()
  const backup = getBackupSql()
  let synced = 0
  
  if (!primary) {
    return { success: false, message: 'Banco primario nao configurado', synced: 0 }
  }
  
  try {
    // Determinar qual banco tem mais dados (esse sera a fonte)
    let sourceDb: NeonQueryFunction<false, false>
    let targetDb: NeonQueryFunction<false, false>
    let sourceName: string
    
    try {
      const primaryCount = await primary`SELECT COUNT(*) as c FROM profiles`
      const backupCount = await backup`SELECT COUNT(*) as c FROM profiles`
      
      if (parseInt(primaryCount[0]?.c || '0') >= parseInt(backupCount[0]?.c || '0')) {
        sourceDb = primary
        targetDb = backup
        sourceName = 'primario -> backup'
      } else {
        sourceDb = backup
        targetDb = primary
        sourceName = 'backup -> primario'
      }
    } catch {
      // Se primario falhar, usa backup como fonte
      sourceDb = backup
      targetDb = primary
      sourceName = 'backup -> primario'
    }
    
    console.log('[DB] Iniciando sync:', sourceName)
    
    // Sync profiles
    try {
      const profiles = await sourceDb`SELECT * FROM profiles`
      for (const p of profiles) {
        try {
          await targetDb`
            INSERT INTO profiles (id, email, name, password_hash, cpf, phone, balance, role, kyc_status, is_admin, is_active, is_blocked, created_at, updated_at)
            VALUES (${p.id}, ${p.email}, ${p.name}, ${p.password_hash}, ${p.cpf}, ${p.phone}, ${p.balance}, ${p.role}, ${p.kyc_status}, ${p.is_admin}, ${p.is_active}, ${p.is_blocked}, ${p.created_at}, ${p.updated_at})
            ON CONFLICT (id) DO UPDATE SET
              balance = EXCLUDED.balance,
              role = EXCLUDED.role,
              kyc_status = EXCLUDED.kyc_status,
              is_admin = EXCLUDED.is_admin,
              is_active = EXCLUDED.is_active,
              is_blocked = EXCLUDED.is_blocked,
              updated_at = NOW()
          `
          synced++
        } catch {}
      }
    } catch (e) {
      console.error('[DB] Erro sync profiles:', e)
    }
    
    // Sync transactions
    try {
      const txs = await sourceDb`SELECT * FROM transactions`
      for (const t of txs) {
        try {
          await targetDb`
            INSERT INTO transactions (id, user_id, type, amount, status, description, metadata, created_at)
            VALUES (${t.id}, ${t.user_id}, ${t.type}, ${t.amount}, ${t.status}, ${t.description}, ${t.metadata}, ${t.created_at})
            ON CONFLICT (id) DO NOTHING
          `
          synced++
        } catch {}
      }
    } catch {}
    
    // Sync pix_keys
    try {
      const keys = await sourceDb`SELECT * FROM pix_keys`
      for (const k of keys) {
        try {
          await targetDb`
            INSERT INTO pix_keys (id, user_id, key_type, key_value, is_active, created_at)
            VALUES (${k.id}, ${k.user_id}, ${k.key_type}, ${k.key_value}, ${k.is_active}, ${k.created_at})
            ON CONFLICT (id) DO NOTHING
          `
          synced++
        } catch {}
      }
    } catch {}
    
    // Sync withdrawals
    try {
      const wds = await sourceDb`SELECT * FROM withdrawals`
      for (const w of wds) {
        try {
          await targetDb`
            INSERT INTO withdrawals (id, user_id, amount, status, pix_key, pix_key_type, created_at, processed_at)
            VALUES (${w.id}, ${w.user_id}, ${w.amount}, ${w.status}, ${w.pix_key}, ${w.pix_key_type}, ${w.created_at}, ${w.processed_at})
            ON CONFLICT (id) DO NOTHING
          `
          synced++
        } catch {}
      }
    } catch {}
    
    return { success: true, message: `Sync completo: ${sourceName}`, synced }
  } catch (error: any) {
    return { success: false, message: error.message, synced }
  }
}
