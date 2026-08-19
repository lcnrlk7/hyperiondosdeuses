import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET - Lista as adquirentes disponíveis para o usuário selecionar.
 * Expõe apenas a nominal e o ticket máximo (nunca a API key/company id).
 * Inclui estatísticas GLOBAIS de uso e conversão por adquirente.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const profileRows = await sql`SELECT acquirer_id, auto_retry_acquirer FROM profiles WHERE id = ${user.id}`;
    const selectedId = profileRows[0]?.acquirer_id || null;
    const autoRetry = Boolean(profileRows[0]?.auto_retry_acquirer);

    const acquirers = await sql`
      SELECT id, name, badge, max_ticket, priority
      FROM acquirers
      WHERE is_selectable = true AND is_active = true
      ORDER BY priority ASC
    `;

    if (acquirers.length === 0) {
      return NextResponse.json({ acquirers: [], selectedId, autoRetry });
    }

    const ids = acquirers.map((a) => a.id as string);

    // Estatísticas globais: agrega depósitos (pix_in) por adquirente atual do usuário
    const stats = await sql`
      SELECT p.acquirer_id AS acquirer_id,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
             COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed'), 0)::float AS volume
      FROM transactions t
      JOIN profiles p ON p.id = t.user_id
      WHERE t.type = 'pix_in' AND p.acquirer_id = ANY(${ids})
      GROUP BY p.acquirer_id
    `;

    const statsMap = new Map<string, { total: number; completed: number; volume: number }>();
    for (const s of stats) {
      statsMap.set(s.acquirer_id as string, {
        total: Number(s.total) || 0,
        completed: Number(s.completed) || 0,
        volume: Number(s.volume) || 0,
      });
    }

    const enriched = acquirers.map((a) => {
      const st = statsMap.get(a.id as string) || { total: 0, completed: 0, volume: 0 };
      const conversion = st.total > 0 ? (st.completed / st.total) * 100 : 0;
      return {
        id: a.id as string,
        name: a.name as string,
        badge: (a.badge as string) || null,
        maxTicket: Number(a.max_ticket) || 0,
        deposits: st.total,
        conversion: Math.round(conversion * 10) / 10,
        volume: st.volume,
        selected: a.id === selectedId,
      };
    });

    // Marca a mais usada e a de melhor conversão (com amostra mínima)
    let mostUsedId: string | null = null;
    let bestConvId: string | null = null;
    let maxDeposits = -1;
    let bestConv = -1;
    for (const a of enriched) {
      if (a.deposits > maxDeposits) {
        maxDeposits = a.deposits;
        mostUsedId = a.id;
      }
      if (a.deposits >= 3 && a.conversion > bestConv) {
        bestConv = a.conversion;
        bestConvId = a.id;
      }
    }

    const result = enriched.map((a) => ({
      ...a,
      isMostUsed: a.id === mostUsedId && a.deposits > 0,
      isBestConversion: a.id === bestConvId,
    }));

    return NextResponse.json({ acquirers: result, selectedId, autoRetry });
  } catch (error) {
    console.error("[user/acquirers] GET error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PUT - Seleciona a adquirente que o usuário quer usar para gerar depósitos.
 */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { acquirerId } = await request.json();
    if (!acquirerId) {
      return NextResponse.json({ error: "acquirerId obrigatório" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id FROM acquirers
      WHERE id = ${acquirerId} AND is_selectable = true AND is_active = true
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Adquirente indisponível" }, { status: 400 });
    }

    await sql`UPDATE profiles SET acquirer_id = ${acquirerId} WHERE id = ${user.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[user/acquirers] PUT error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * POST - Liga/desliga a retentativa automática (fallback de adquirente).
 * Quando ligada, se a adquirente selecionada falhar ao gerar o PIX, o sistema
 * tenta automaticamente as demais adquirentes ativas — mesmo as não selecionáveis.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { autoRetry } = await request.json();
    await sql`UPDATE profiles SET auto_retry_acquirer = ${Boolean(autoRetry)} WHERE id = ${user.id}`;

    return NextResponse.json({ success: true, autoRetry: Boolean(autoRetry) });
  } catch (error) {
    console.error("[user/acquirers] POST error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
