// Fonte unica de verdade para o segredo JWT.
//
// SEGURANCA: nao existe mais fallback hardcoded. Um segredo publico no codigo
// permitiria a qualquer pessoa forjar tokens de sessao (inclusive de admin/CEO).
// O segredo DEVE vir da variavel de ambiente JWT_SECRET, com no minimo 32 chars.

let cachedBytes: Uint8Array | null = null;

/** Retorna o segredo JWT como string, lancando erro se ausente/fraco. */
export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET ausente ou fraco. Defina a variavel de ambiente JWT_SECRET com pelo menos 32 caracteres.",
    );
  }
  return secret;
}

/** Retorna o segredo JWT codificado (para jose SignJWT/jwtVerify). */
export function getJwtSecret(): Uint8Array {
  if (cachedBytes) return cachedBytes;
  cachedBytes = new TextEncoder().encode(requireJwtSecret());
  return cachedBytes;
}
