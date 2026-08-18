import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { MedusaOnline, isMedusaOnline } from "@/lib/acquirers/medusa-online";

/**
 * POST - Teste em tempo real da adquirente.
 * Gera um PIX mínimo real para o usuário confirmar que está funcional.
 * Não expõe credenciais nem persiste transação.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    const { acquirerId } = await request.json();
    if (!acquirerId) {
      return NextResponse.json({ success: false, error: "acquirerId obrigatório" }, { status: 400 });
    }

    const rows = await sql`
      SELECT * FROM acquirers
      WHERE id = ${acquirerId} AND is_selectable = true AND is_active = true
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Adquirente indisponível" }, { status: 404 });
    }

    const acquirer = rows[0] as Record<string, any>;
    if (!isMedusaOnline(acquirer) || !acquirer.api_key) {
      return NextResponse.json({ success: false, error: "Adquirente não suportada para teste" }, { status: 400 });
    }

    const client = new MedusaOnline({ apiKey: acquirer.api_key, baseUrl: acquirer.api_url });
    const result = await client.createPix({
      valor: 1,
      clienteNome: "Teste de Conexão",
      clienteEmail: "teste@hyperionpay.com.br",
      clienteCpf: "36009722004",
      produto: "Teste de disponibilidade",
      idempotencyKey: `utest-${user.id}-${acquirerId}-${Date.now()}`,
    });

    const latencyMs = result.latencyMs ?? 0;

    // Atualiza saúde da adquirente
    await sql`
      UPDATE acquirers
      SET health_status = ${result.success ? "online" : "offline"},
          last_health_check = NOW(),
          avg_response_time = ${latencyMs}
      WHERE id = ${acquirerId}
    `;

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Falha no teste", latencyMs });
    }

    return NextResponse.json({
      success: true,
      latencyMs,
      functional: Boolean(result.qrCode || result.qrCodeBase64) || result.simulated,
    });
  } catch (error) {
    console.error("[user/acquirers/test] error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 },
    );
  }
}
