import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export type VerificationResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

/**
 * SEGURANCA: exige que o usuario tenha concluido o KYC E a prova de vida (Didit)
 * antes de qualquer acao que gere cobranca ou movimente dinheiro (PIX in/out,
 * saques, transferencias) — inclusive pela API publica.
 *
 * Consulta o banco diretamente (fonte unica da verdade), independentemente das
 * colunas que o endpoint chamador tenha selecionado. Assim, mesmo contas com
 * "KYC legado" aprovado sem prova de vida ficam bloqueadas ate concluir a Didit.
 *
 * Retorna { ok: true } quando liberado, ou { ok: false, response } com o erro
 * HTTP apropriado para o chamador retornar imediatamente.
 */
export async function assertUserVerified(userId: string): Promise<VerificationResult> {
  const rows = await sql`
    SELECT kyc_status, liveness_status, is_active, is_blocked
    FROM profiles
    WHERE id = ${userId}
  `;
  const p = rows[0];

  if (!p) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Conta não encontrada", code: "NOT_FOUND" },
        { status: 404 }
      ),
    };
  }

  if (p.is_blocked) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Conta bloqueada", code: "ACCOUNT_BLOCKED" },
        { status: 403 }
      ),
    };
  }

  if (p.is_active === false) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
        { status: 403 }
      ),
    };
  }

  if (p.kyc_status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "KYC não aprovado. Complete a verificação de identidade no dashboard.",
          code: "KYC_REQUIRED",
        },
        { status: 403 }
      ),
    };
  }

  if (p.liveness_status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Verificação de identidade (prova de vida) obrigatória. Conclua a verificação no dashboard.",
          code: "LIVENESS_REQUIRED",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}
