import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Lista as triagens AML/KYT com filtro por status e estatisticas.
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return accessDeniedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);

    // Estatisticas agregadas por status
    const statsRows = await sql`
      SELECT status, COUNT(*)::int AS n
      FROM aml_screenings
      GROUP BY status
    `;
    const stats: Record<string, number> = {
      total: 0,
      APPROVED: 0,
      IN_REVIEW: 0,
      DECLINED: 0,
      AWAITING_USER: 0,
      PENDING: 0,
      ERROR: 0,
    };
    statsRows.forEach((r: { status: string; n: number }) => {
      stats[r.status] = r.n;
      stats.total += r.n;
    });

    // Lista filtrada com dados do usuario
    let screenings;
    if (status === "all") {
      screenings = await sql`
        SELECT a.id, a.transaction_ref, a.didit_transaction_id, a.user_id,
               a.internal_entity, a.internal_entity_id, a.direction, a.amount,
               a.currency, a.status, a.risk_score, a.created_at, a.updated_at,
               p.name AS user_name, p.email AS user_email
        FROM aml_screenings a
        LEFT JOIN profiles p ON p.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    } else if (status === "flagged") {
      // Atalho para o que exige atencao
      screenings = await sql`
        SELECT a.id, a.transaction_ref, a.didit_transaction_id, a.user_id,
               a.internal_entity, a.internal_entity_id, a.direction, a.amount,
               a.currency, a.status, a.risk_score, a.created_at, a.updated_at,
               p.name AS user_name, p.email AS user_email
        FROM aml_screenings a
        LEFT JOIN profiles p ON p.id = a.user_id
        WHERE a.status IN ('IN_REVIEW', 'DECLINED', 'AWAITING_USER')
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      screenings = await sql`
        SELECT a.id, a.transaction_ref, a.didit_transaction_id, a.user_id,
               a.internal_entity, a.internal_entity_id, a.direction, a.amount,
               a.currency, a.status, a.risk_score, a.created_at, a.updated_at,
               p.name AS user_name, p.email AS user_email
        FROM aml_screenings a
        LEFT JOIN profiles p ON p.id = a.user_id
        WHERE a.status = ${status}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ screenings, stats });
  } catch (error) {
    console.error("[Admin AML] Erro ao listar triagens:", error);
    return NextResponse.json(
      { error: "Erro ao carregar monitoramento AML" },
      { status: 500 },
    );
  }
}
