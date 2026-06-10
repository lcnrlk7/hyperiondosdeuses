import { sql } from "../lib/db"

/**
 * SCRIPT DE REMOCAO DOS DADOS DE DEMONSTRACAO
 * ------------------------------------------------------------
 * Remove TODOS os registros marcados com is_demo = true das
 * tabelas profiles, transactions e withdrawals.
 *
 * Os dados reais (is_demo = false / null) permanecem intactos.
 * Rode com: pnpm tsx scripts/clear-demo-data.ts
 * ------------------------------------------------------------
 */

async function main() {
  console.log("[demo] Removendo dados de demonstracao...")

  const wd = await sql`DELETE FROM withdrawals WHERE is_demo = true`
  const tx = await sql`DELETE FROM transactions WHERE is_demo = true`
  const pr = await sql`DELETE FROM profiles WHERE is_demo = true`

  console.log("[demo] Saques demo removidos.")
  console.log("[demo] Transacoes demo removidas.")
  console.log("[demo] Usuarios demo removidos.")
  console.log("[demo] Limpeza concluida. Dados reais preservados.")

  process.exit(0)
}

main().catch((e) => {
  console.error("[demo] Erro:", e)
  process.exit(1)
})
