import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  sendWhatsappText,
  isEvolutionConfigured,
} from "@/lib/whatsapp/evolution";

export const maxDuration = 300;

// GET - estatisticas de destinatarios disponiveis + status da configuracao
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const total = await sql`
      SELECT COUNT(*)::int AS n
      FROM profiles
      WHERE phone IS NOT NULL AND phone <> ''
        AND (is_demo = false OR is_demo IS NULL)
    `;

    return NextResponse.json({
      totalRecipients: total[0]?.n ?? 0,
      configured: isEvolutionConfigured(),
    });
  } catch (error) {
    console.error("[WhatsappCampaign] Erro ao contar destinatarios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar destinatarios" },
      { status: 500 }
    );
  }
}

// Substitui {nome} pelo nome do destinatario (primeiro nome)
function personalize(message: string, name: string | null): string {
  const firstName = (name || "").trim().split(" ")[0] || "cliente";
  return message.replace(/\{nome\}/g, firstName);
}

// POST - dispara a campanha de WhatsApp
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  if (!isEvolutionConfigured()) {
    return NextResponse.json(
      {
        error:
          "Evolution API nao configurada. Defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { message, testPhone } = body;

    // Intervalo entre mensagens (em segundos) com variacao aleatoria para
    // reduzir o risco de bloqueio por spam. Limites de seguranca aplicados.
    const minDelaySec = Math.min(Math.max(Number(body.minDelay) || 3, 1), 120);
    const maxDelaySec = Math.min(
      Math.max(Number(body.maxDelay) || minDelaySec, minDelaySec),
      300
    );

    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json(
        { error: "A mensagem e obrigatoria" },
        { status: 400 }
      );
    }

    // Envio de teste para um unico numero
    if (testPhone) {
      const result = await sendWhatsappText(
        testPhone,
        personalize(message, null)
      );
      return NextResponse.json({
        success: result.ok,
        test: true,
        sent: result.ok ? 1 : 0,
        failed: result.ok ? 0 : 1,
      });
    }

    // Buscar todos os telefones cadastrados (exclui contas demo)
    const recipients = await sql`
      SELECT name, phone
      FROM profiles
      WHERE phone IS NOT NULL AND phone <> ''
        AND (is_demo = false OR is_demo IS NULL)
    `;

    if (recipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Nenhum telefone cadastrado",
        sent: 0,
        failed: 0,
      });
    }

    let sent = 0;
    let failed = 0;
    const log: { phone: string; name: string | null; ok: boolean }[] = [];

    // WhatsApp e mais sensivel a flood: enviamos um a um com intervalo
    // aleatorio entre minDelaySec e maxDelaySec para simular comportamento humano.
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i] as { name: string | null; phone: string };
      const result = await sendWhatsappText(
        r.phone,
        personalize(message, r.name)
      );
      result.ok ? sent++ : failed++;
      log.push({ phone: r.phone, name: r.name, ok: result.ok });

      // intervalo aleatorio entre mensagens (nao espera apos a ultima)
      if (i < recipients.length - 1) {
        const delayMs =
          (minDelaySec + Math.random() * (maxDelaySec - minDelaySec)) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Registrar no historico (best-effort)
    try {
      await sql`
        INSERT INTO admin_notifications (title, body, type, sent_at, sent_count, created_by)
        VALUES ('Campanha WhatsApp', ${message.slice(0, 200)}, 'whatsapp_campaign', NOW(), ${sent}, ${admin.userId})
      `;
    } catch (logErr) {
      console.error("[WhatsappCampaign] Falha ao registrar historico:", logErr);
    }

    return NextResponse.json({
      success: sent > 0,
      message: `Campanha enviada para ${sent} de ${recipients.length} numeros`,
      sent,
      failed,
      total: recipients.length,
      log,
    });
  } catch (error) {
    console.error("[WhatsappCampaign] Erro ao disparar campanha:", error);
    return NextResponse.json(
      { error: "Erro ao disparar campanha" },
      { status: 500 }
    );
  }
}
