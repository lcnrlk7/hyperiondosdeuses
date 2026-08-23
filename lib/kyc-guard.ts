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
    SELECT COALESCE(parent.kyc_status, child.kyc_status) as kyc_status,
           child.is_active,
           COALESCE(parent.is_blocked, child.is_blocked) as is_blocked
    FROM profiles child
    LEFT JOIN profiles parent ON parent.id::text = child.parent_profile_id
    WHERE child.id = ${userId}
  `;
  const p = rows[0];

  if (!p) {
    return NextResponse.json(
      { success: false, error: "Conta não encontrada", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (p.is_blocked) {
    return NextResponse.json(
      { success: false, error: "Conta bloqueada", code: "ACCOUNT_BLOCKED" },
      { status: 403 }
    );
  }

  if (p.is_active === false) {
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
