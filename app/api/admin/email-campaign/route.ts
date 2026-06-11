import { verifyAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendCampaignEmail } from "@/lib/email";

export const maxDuration = 300;

// GET - estatisticas de destinatarios disponiveis
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const total = await sql`
      SELECT COUNT(*)::int AS n
      FROM profiles
      WHERE email IS NOT NULL AND email <> ''
        AND (is_demo = false OR is_demo IS NULL)
    `;

    return NextResponse.json({ totalRecipients: total[0]?.n ?? 0 });
  } catch (error) {
    console.error("[EmailCampaign] Erro ao contar destinatarios:", error);
    return NextResponse.json({ error: "Erro ao buscar destinatarios" }, { status: 500 });
  }
}

// POST - dispara a campanha de email para todos os emails cadastrados
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const body = await request.json();
    const {
      subject,
      heading,
      bodyHtml,
      highlight,
      highlightLabel,
      ctaText,
      ctaUrl,
      secondaryText,
      secondaryUrl,
      testEmail,
    } = body;

    if (!subject || !heading || !bodyHtml) {
      return NextResponse.json(
        { error: "Assunto, titulo e mensagem sao obrigatorios" },
        { status: 400 }
      );
    }

    // Envio de teste para um unico email
    if (testEmail) {
      const ok = await sendCampaignEmail({
        to: testEmail,
        subject,
        heading,
        bodyHtml,
        highlight,
        highlightLabel,
        ctaText,
        ctaUrl,
        secondaryText,
        secondaryUrl,
      });
      return NextResponse.json({
        success: ok,
        test: true,
        sent: ok ? 1 : 0,
        failed: ok ? 0 : 1,
      });
    }

    // Buscar todos os emails cadastrados (exclui contas demo)
    const recipients = await sql`
      SELECT name, email
      FROM profiles
      WHERE email IS NOT NULL AND email <> ''
        AND (is_demo = false OR is_demo IS NULL)
    `;

    if (recipients.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum email cadastrado", sent: 0, failed: 0 });
    }

    let sent = 0;
    let failed = 0;
    const log: { email: string; name: string | null; ok: boolean }[] = [];

    // Enviar em lotes para respeitar limites de taxa do provedor
    const BATCH_SIZE = 10;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((r: { name: string | null; email: string }) =>
          sendCampaignEmail({
            to: r.email,
            name: r.name || undefined,
            subject,
            heading,
            bodyHtml,
            highlight,
            highlightLabel,
            ctaText,
            ctaUrl,
            secondaryText,
            secondaryUrl,
          })
        )
      );
      results.forEach((ok, idx) => {
        ok ? sent++ : failed++;
        log.push({ email: batch[idx].email, name: batch[idx].name, ok });
      });
      // Pequena pausa entre lotes
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    // Registrar no historico de notificacoes administrativas (best-effort)
    try {
      await sql`
        INSERT INTO admin_notifications (title, body, type, sent_at, sent_count, created_by)
        VALUES (${subject}, ${heading}, 'email_campaign', NOW(), ${sent}, ${admin.userId})
      `;
    } catch (logErr) {
      console.error("[EmailCampaign] Falha ao registrar historico:", logErr);
    }

    return NextResponse.json({
      success: sent > 0,
      message: `Campanha enviada para ${sent} de ${recipients.length} emails`,
      sent,
      failed,
      total: recipients.length,
      log,
    });
  } catch (error) {
    console.error("[EmailCampaign] Erro ao disparar campanha:", error);
    return NextResponse.json({ error: "Erro ao disparar campanha" }, { status: 500 });
  }
}
