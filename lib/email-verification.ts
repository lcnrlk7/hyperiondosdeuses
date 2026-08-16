import { sql } from "@/lib/db";

/**
 * Prova server-side de que um email foi verificado por codigo.
 *
 * O fluxo de cadastro tem 3 passos no cliente (dados -> codigo -> senha), mas
 * ate agora nada impedia um atacante de chamar /api/auth/register diretamente,
 * PULANDO a verificacao de email. Este modulo fecha essa brecha:
 *
 *   1. Quando o codigo de verificacao e validado (/api/auth/verify-code),
 *      gravamos uma "prova" de que aquele email foi verificado.
 *   2. /api/auth/register SO cria a conta se existir uma prova valida e a
 *      consome (uso unico). Sem prova => cadastro recusado.
 *
 * Reutiliza a tabela `email_verification_codes` com a chave prefixada por
 * `verified:` para isolar completamente dos codigos de cadastro/login/reset.
 */

const VERIFIED_PREFIX = "verified:";
const PROOF_TTL_MS = 30 * 60 * 1000; // 30 minutos para concluir o cadastro

function key(email: string): string {
  return `${VERIFIED_PREFIX}${email.trim().toLowerCase()}`;
}

/**
 * Marca um email como verificado (chamado apos o codigo ser validado).
 * Invalida provas anteriores e cria uma nova, valida por 30 minutos.
 */
export async function markEmailVerified(email: string): Promise<void> {
  const k = key(email);
  await sql`
    UPDATE email_verification_codes
    SET used = true
    WHERE email = ${k} AND used = false
  `;
  const expiresAt = new Date(Date.now() + PROOF_TTL_MS);
  await sql`
    INSERT INTO email_verification_codes (email, code, expires_at)
    VALUES (${k}, ${"ok"}, ${expiresAt.toISOString()})
  `;
}

/**
 * Consome a prova de verificacao de email (uso unico). Retorna true se o email
 * foi verificado recentemente; false caso contrario. Chamado no /register.
 */
export async function consumeEmailVerified(email: string): Promise<boolean> {
  const k = key(email);
  const rows = await sql`
    SELECT id FROM email_verification_codes
    WHERE email = ${k} AND used = false AND expires_at >= NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (rows.length === 0) return false;
  await sql`UPDATE email_verification_codes SET used = true WHERE id = ${rows[0].id}`;
  return true;
}
