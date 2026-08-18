import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";
import { MedusaOnline, isMedusaOnline } from "@/lib/acquirers/medusa-online";

/**
 * Teste em tempo real de uma adquirente.
 * Gera um PIX mínimo real para validar credenciais e roteamento.
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const { acquirerId } = await request.json();
    if (!acquirerId) {
      return NextResponse.json({ success: false, error: "acquirerId obrigatório" }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM acquirers WHERE id = ${acquirerId} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Adquirente não encontrada" }, { status: 404 });
    }

    const acquirer = rows[0] as Record<string, any>;

    if (!isMedusaOnline(acquirer)) {
      return NextResponse.json(
        { success: false, error: "Teste disponível apenas para adquirentes Medusa Online" },
        { status: 400 },
      );
    }

    if (!acquirer.api_key) {
      return NextResponse.json({ success: false, error: "Adquirente sem API Key configurada" }, { status: 400 });
    }

    const client = new MedusaOnline({ apiKey: acquirer.api_key, baseUrl: acquirer.api_url });
    const started = Date.now();
    const result = await client.createPix({
      valor: 1,
      clienteNome: "Teste Hyperion Pay",
      clienteEmail: "teste@hyperionpay.com.br",
      clienteCpf: "36009722004",
      produto: "Teste de conexão da adquirente",
      idempotencyKey: `test-${acquirerId}-${Date.now()}`,
    });
    const latencyMs = result.latencyMs ?? Date.now() - started;

    // Atualiza saúde da adquirente com base no teste
    await sql`
      UPDATE acquirers
      SET health_status = ${result.success ? "online" : "offline"},
          last_health_check = NOW(),
          avg_response_time = ${latencyMs}
      WHERE id = ${acquirerId}
    `;

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Falha ao gerar PIX de teste",
        latencyMs,
      });
    }

    return NextResponse.json({
      success: true,
      latencyMs,
      hasQrCode: Boolean(result.qrCode || result.qrCodeBase64),
      simulated: result.simulated,
      status: result.status,
      transactionId: result.transactionId,
    });
  } catch (error) {
    console.error("[admin/acquirers/test] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 },
    );
  }
}
