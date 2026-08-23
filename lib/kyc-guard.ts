import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * SEGURANCA: exige que o usuario tenha KYC manual aprovado antes de qualquer
 * acao que gere cobranca ou movimente dinheiro (PIX in/out, transferencias),
 * inclusive pela API publica.
 *
 * Consulta o banco diretamente como fonte unica da verdade. Subcontas herdam
 * o estado de KYC da conta principal proprietaria.
 *
 * Retorna `null` quando o usuario esta liberado, ou uma `NextResponse` com o
 * erro HTTP apropriado para o chamador retornar imediatamente:
 *
 *   const denied = await assertUserVerified(userId);
 *   if (denied) return denied;
 */
export async function assertUserVerified(userId: string): Promise<NextResponse | null> {
  const rows = await sql`
    SELECT
      CASE WHEN child.parent_profile_id IS NULL THEN child.kyc_status ELSE parent.kyc_status END AS kyc_status,
      child.is_active,
      child.is_blocked,
      child.parent_profile_id,
      parent.id AS parent_id,
      parent.is_active AS parent_is_active,
      parent.is_blocked AS parent_is_blocked
    FROM profiles child
    LEFT JOIN profiles parent ON parent.id::text = child.parent_profile_id
    WHERE child.id = ${userId}
    LIMIT 1
  `;
  const p = rows[0];

  if (!p) {
    return NextResponse.json(
      { success: false, error: "Conta não encontrada", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (p.parent_profile_id && !p.parent_id) {
    return NextResponse.json(
      { success: false, error: "Contexto de conta inválido", code: "INVALID_ACCOUNT_CONTEXT" },
      { status: 403 }
    );
  }

  if (p.is_blocked || (p.parent_profile_id && p.parent_is_blocked)) {
    return NextResponse.json(
      { success: false, error: "Conta bloqueada", code: "ACCOUNT_BLOCKED" },
      { status: 403 }
    );
  }

  if (p.is_active !== true || (p.parent_profile_id && p.parent_is_active !== true)) {
    return NextResponse.json(
      { success: false, error: "Conta desativada", code: "ACCOUNT_DISABLED" },
      { status: 403 }
    );
  }

  if (p.kyc_status !== "approved") {
    return NextResponse.json(
      {
        success: false,
        error: "KYC não aprovado. Complete a verificação de identidade no dashboard.",
        code: "KYC_REQUIRED",
      },
      { status: 403 }
    );
  }

  return null;
}
