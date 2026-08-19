// Fonte unica de verdade para o segredo JWT.
// O valor e injetado pela plataforma no processo do dev server em runtime.
//
// SEGURANCA: nao existe mais fallback hardcoded. Um segredo publico no codigo
// permitiria a qualquer pessoa forjar tokens de sessao (inclusive de admin/CEO).
// O segredo DEVE vir da variavel de ambiente JWT_SECRET, com no minimo 32 chars.

let cachedBytes: Uint8Array | null = null;

// Durante `next build` (fase de coleta de dados / prerender), o segredo real
// pode nao estar injetado no process.env. Nao devemos QUEBRAR o build por isso
// — a validacao estrita acontece em runtime, quando uma requisicao realmente
// usa o segredo. Detectamos a fase de build via NEXT_PHASE.
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/** Retorna o segredo JWT como string, lancando erro se ausente/fraco. */
export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Em build, retorna um placeholder efemero (nunca usado para assinar/validar
    // tokens reais) para permitir a analise estatica das rotas sem enfraquecer
    // a seguranca em producao.
    if (isBuildPhase()) {
      return "build-time-placeholder-not-used-at-runtime-000";
    }
    throw new Error(
      "JWT_SECRET ausente ou fraco. Defina a variavel de ambiente JWT_SECRET com pelo menos 32 caracteres.",
    );
  }
  return secret;
}

/** Retorna o segredo JWT codificado (para jose SignJWT/jwtVerify). */
export function getJwtSecret(): Uint8Array {
  // Nao cacheia durante o build para nao "congelar" o placeholder.
  if (isBuildPhase()) {
    return new TextEncoder().encode(requireJwtSecret());
  }
  if (cachedBytes) return cachedBytes;
  cachedBytes = new TextEncoder().encode(requireJwtSecret());
  return cachedBytes;
}
