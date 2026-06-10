import { sql } from "../lib/db"
import bcrypt from "bcryptjs"

/**
 * SCRIPT DE DADOS DE DEMONSTRACAO (SHOWCASE)
 * ------------------------------------------------------------
 * Insere usuarios, transacoes e saques FICTICIOS apenas para
 * apresentacao VISUAL do sistema a potenciais compradores.
 *
 * TUDO e marcado com a flag is_demo = true, separando 100% dos
 * dados reais. Para remover, rode: pnpm tsx scripts/clear-demo-data.ts
 *
 * NAO use estes numeros para fins fiscais/contabeis.
 * ------------------------------------------------------------
 */

const PRIMEIROS_NOMES = [
  "Lucas", "Maria", "Joao", "Ana", "Pedro", "Juliana", "Rafael", "Fernanda",
  "Bruno", "Camila", "Felipe", "Larissa", "Gustavo", "Beatriz", "Rodrigo",
  "Mariana", "Thiago", "Carolina", "Matheus", "Amanda", "Leonardo", "Patricia",
  "Diego", "Vanessa", "Gabriel", "Leticia", "Daniel", "Aline", "Vinicius",
  "Bruna", "Eduardo", "Isabela", "Marcelo", "Natalia", "Andre", "Renata",
  "Ricardo", "Tatiane", "Fabio", "Priscila", "Caio", "Jessica", "Henrique",
  "Sabrina", "Igor", "Carla", "Otavio", "Debora", "Murilo", "Raquel",
]

const SOBRENOMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
  "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
  "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha",
  "Dias", "Nascimento", "Andrade", "Moreira", "Nunes", "Marques", "Machado",
]

const BANCOS = ["Nubank", "Itau", "Bradesco", "Santander", "Banco do Brasil", "Caixa", "Inter", "C6 Bank", "PicPay", "Mercado Pago"]
const PIX_TYPES = ["cpf", "email", "phone", "random"]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}
function randomCPF() {
  return `${randInt(100, 999)}.${randInt(100, 999)}.${randInt(100, 999)}-${randInt(10, 99)}`
}
function randomPhone() {
  return `(${randInt(11, 99)}) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`
}

// Distribuicao mensal de volume (crescimento visual) - mar/2025 ate jun/2026
const MESES_DEMO = [
  { ano: 2025, mes: 2, alvo: 37000 },
  { ano: 2025, mes: 3, alvo: 46000 },
  { ano: 2025, mes: 4, alvo: 58000 },
  { ano: 2025, mes: 5, alvo: 69000 },
  { ano: 2025, mes: 6, alvo: 82000 },
  { ano: 2025, mes: 7, alvo: 95000 },
  { ano: 2025, mes: 8, alvo: 112000 },
  { ano: 2025, mes: 9, alvo: 128000 },
  { ano: 2025, mes: 10, alvo: 147000 },
  { ano: 2025, mes: 11, alvo: 169000 },
  { ano: 2026, mes: 0, alvo: 198000 },
  { ano: 2026, mes: 1, alvo: 224000 },
  { ano: 2026, mes: 2, alvo: 261000 },
  { ano: 2026, mes: 3, alvo: 298000 },
  { ano: 2026, mes: 4, alvo: 342000 },
]

async function main() {
  console.log("[demo] Iniciando seed de dados de demonstracao...")

  // 1. Garantir colunas is_demo
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false`
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false`
  await sql`ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false`
  console.log("[demo] Colunas is_demo garantidas.")

  // 2. Limpar demo anterior (idempotente)
  await sql`DELETE FROM withdrawals WHERE is_demo = true`
  await sql`DELETE FROM transactions WHERE is_demo = true`
  await sql`DELETE FROM profiles WHERE is_demo = true`
  console.log("[demo] Dados demo anteriores removidos.")

  // 3. Criar usuarios demo
  const NUM_USERS = 180
  const passwordHash = await bcrypt.hash("demo123456", 10)
  const userIds: string[] = []

  for (let i = 0; i < NUM_USERS; i++) {
    const nome = `${pick(PRIMEIROS_NOMES)} ${pick(SOBRENOMES)}`
    const emailBase = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".")
    const email = `${emailBase}${randInt(10, 999)}@${pick(["gmail.com", "hotmail.com", "outlook.com"])}`
    const id = crypto.randomUUID()
    const createdAt = new Date(2025, randInt(2, 11), randInt(1, 28), randInt(8, 22), randInt(0, 59))
    const balance = rand(0, 8500).toFixed(2)
    const feePct = pick([2.99, 3.49, 3.99, 4.49, 4.99])
    const kyc = pick(["approved", "approved", "approved", "pending", "rejected"])

    await sql`
      INSERT INTO profiles (
        id, email, password_hash, name, cpf_cnpj, phone, balance,
        fee_percentage, kyc_status, is_admin, is_active, route_type,
        daily_limit, created_at, updated_at, is_demo
      ) VALUES (
        ${id}, ${email}, ${passwordHash}, ${nome}, ${randomCPF()}, ${randomPhone()}, ${balance},
        ${feePct}, ${kyc}, false, true, 'white',
        50000, ${createdAt.toISOString()}, ${createdAt.toISOString()}, true
      )
    `
    userIds.push(id)
  }
  console.log(`[demo] ${NUM_USERS} usuarios demo criados.`)

  // 4. Criar transacoes demo distribuidas por mes (atingindo alvos de volume)
  let totalTx = 0
  for (const { ano, mes, alvo } of MESES_DEMO) {
    let acumulado = 0
    while (acumulado < alvo) {
      const valor = Number(rand(15, 850).toFixed(2))
      acumulado += valor
      const userId = pick(userIds)
      const dia = randInt(1, 28)
      const hora = randInt(8, 23)
      const createdAt = new Date(ano, mes, dia, hora, randInt(0, 59))
      const fee = Number((valor * 0.015 + 0.2).toFixed(2))
      const net = Number((valor - fee).toFixed(2))
      // 88% aprovadas, resto pendente/cancelada
      const r = Math.random()
      const status = r < 0.88 ? "completed" : r < 0.95 ? "pending" : "cancelled"
      const paidAt = status === "completed" ? createdAt.toISOString() : null

      await sql`
        INSERT INTO transactions (
          id, user_id, type, amount, fee, net_amount, status,
          pix_key_type, payer_name, description, paid_at,
          created_at, updated_at, is_demo
        ) VALUES (
          ${crypto.randomUUID()}, ${userId}, 'pix_in', ${valor}, ${fee}, ${net}, ${status},
          ${pick(PIX_TYPES)}, ${`${pick(PRIMEIROS_NOMES)} ${pick(SOBRENOMES)}`}, 'Pagamento PIX', ${paidAt},
          ${createdAt.toISOString()}, ${createdAt.toISOString()}, true
        )
      `
      totalTx++
    }
  }
  console.log(`[demo] ${totalTx} transacoes demo criadas.`)

  // 5. Criar saques demo
  const NUM_WD = 120
  for (let i = 0; i < NUM_WD; i++) {
    const userId = pick(userIds)
    const valor = Number(rand(50, 3500).toFixed(2))
    const fee = Number((valor * 0.01).toFixed(2))
    const net = Number((valor - fee).toFixed(2))
    const createdAt = new Date(2025 + (Math.random() > 0.5 ? 1 : 0), randInt(2, 11), randInt(1, 28), randInt(8, 22), randInt(0, 59))
    const r = Math.random()
    const status = r < 0.7 ? "completed" : r < 0.85 ? "pending" : r < 0.95 ? "processing" : "rejected"

    await sql`
      INSERT INTO withdrawals (
        id, user_id, amount, fee, net_amount, pix_key, pix_key_type, status,
        recipient_name, recipient_bank, created_at, updated_at,
        completed_at, is_demo
      ) VALUES (
        ${crypto.randomUUID()}, ${userId}, ${valor}, ${fee}, ${net},
        ${randomCPF()}, ${pick(PIX_TYPES)}, ${status},
        ${`${pick(PRIMEIROS_NOMES)} ${pick(SOBRENOMES)}`}, ${pick(BANCOS)},
        ${createdAt.toISOString()}, ${createdAt.toISOString()},
        ${status === "completed" ? createdAt.toISOString() : null}, true
      )
    `
  }
  console.log(`[demo] ${NUM_WD} saques demo criados.`)

  console.log("[demo] Seed concluido com sucesso! Todos marcados com is_demo=true.")
  process.exit(0)
}

main().catch((e) => {
  console.error("[demo] Erro:", e)
  process.exit(1)
})
