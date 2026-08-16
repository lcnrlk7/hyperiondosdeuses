import { sql } from "@/lib/db";
import { generateVerificationCode } from "@/lib/email";

/**
 * Codigos de acesso por email para o login em 2 etapas.
 *
 * Reutiliza a tabela `email_verification_codes`, mas prefixa a chave `email`
 * com `login:` para isolar completamente dos codigos de cadastro/reset de
 * senha (que usam o email puro). Assim um codigo de cadastro nunca serve para
 * concluir um login e vice-versa.
 *
 * A verificacao acontece SEMPRE no servidor: o token de sessao so e emitido
 * depois que este modulo confirmar o codigo. O cliente nunca recebe o token
 * sem passar por aqui, entao nao ha como burlar pulando a etapa do codigo.
 */

const LOGIN_PREFIX = "login:";
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ATTEMPTS = 5; // tentativas erradas antes de invalidar o codigo
const RESEND_COOLDOWN_MS = 30 * 1000; // intervalo minimo entre reenvios

function key(email: string): string {
  return `${LOGIN_PREFIX}${email.toLowerCase()}`;
}

/**
 * Gera um novo codigo de acesso para o email informado, invalidando os
 * anteriores. Aplica um cooldown simples para evitar flood de emails.
 * Retorna o codigo gerado (para ser enviado por email) ou null se em cooldown.
 */
export async function createLoginCode(
  email: string
): Promise<{ code: string | null; cooldown: boolean }> {
  const k = key(email);

  // Cooldown: se o ultimo codigo foi criado ha menos de RESEND_COOLDOWN_MS, recusa.
  const recent = await sql`
    SELECT created_at FROM email_verification_codes
    WHERE email = ${k}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (recent.length > 0 && recent[0].created_at) {
    const last = new Date(recent[0].created_at).getTime();
    if (Date.now() - last < RESEND_COOLDOWN_MS) {
      return { code: null, cooldown: true };
    }
  }

  // Invalida codigos anteriores nao usados
  await sql`
    UPDATE email_verification_codes
    SET used = true
    WHERE email = ${k} AND used = false
  `;

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  // Guarda "code|attempts" para controlar tentativas sem alterar o schema.
  await sql`
    INSERT INTO email_verification_codes (email, code, expires_at)
    VALUES (${k}, ${`${code}|0`}, ${expiresAt.toISOString()})
  `;

  return { code, cooldown: false };
}

/**
 * Verifica o codigo de acesso. Consome o codigo quando correto e contabiliza
 * tentativas erradas, invalidando o codigo apos MAX_ATTEMPTS falhas.
 */
export async function verifyLoginCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const k = key(email);
  const cleanCode = (code || "").replace(/\D/g, "").slice(0, 6);

  if (cleanCode.length !== 6) {
    return { valid: false, error: "Codigo invalido" };
  }

  const rows = await sql`
    SELECT id, code FROM email_verification_codes
    WHERE email = ${k} AND used = false AND expires_at >= NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { valid: false, error: "Codigo invalido ou expirado" };
  }

  const row = rows[0];
  const [storedCode, attemptsStr] = String(row.code).split("|");
  const attempts = Number(attemptsStr || "0");

  if (storedCode !== cleanCode) {
    const newAttempts = attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      // Muitas tentativas: queima o codigo
      await sql`UPDATE email_verification_codes SET used = true WHERE id = ${row.id}`;
      return { valid: false, error: "Muitas tentativas. Solicite um novo codigo." };
    }
    await sql`
      UPDATE email_verification_codes
      SET code = ${`${storedCode}|${newAttempts}`}
      WHERE id = ${row.id}
    `;
    return { valid: false, error: "Codigo invalido ou expirado" };
  }

  // Correto: consome o codigo (uso unico)
  await sql`UPDATE email_verification_codes SET used = true WHERE id = ${row.id}`;
  return { valid: true };
}
