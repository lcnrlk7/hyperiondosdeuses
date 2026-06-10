import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Get user's webhook config
    const webhookConfigs = await sql`
      SELECT * FROM webhook_configs WHERE user_id = ${user.id} LIMIT 1
    `;

    const webhookConfig = webhookConfigs[0];

    if (!webhookConfig || !webhookConfig.url) {
      return NextResponse.json(
        { error: "Nenhum webhook configurado", sent: 0 },
        { status: 400 }
      );
    }

    // Get transactions from the last 24 hours
    const recentTransactions = await sql`
      SELECT * FROM transactions 
      WHERE user_id = ${user.id} 
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    if (recentTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma transação nas últimas 24h",
        sent: 0,
      });
    }

    // Resend webhooks for each transaction
    let sentCount = 0;
    let failedCount = 0;

    for (const tx of recentTransactions) {
      try {
        const webhookPayload = {
          event: tx.type === "pix_in" ? "payment.received" : "payment.sent",
          transaction_id: tx.id,
          external_id: tx.external_id,
          amount: tx.amount,
          status: tx.status,
          payer_name: tx.payer_name,
          payer_document: tx.payer_document,
          created_at: tx.created_at,
          paid_at: tx.paid_at,
        };

        const response = await fetch(webhookConfig.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhookConfig.secret && {
              "X-Webhook-Secret": webhookConfig.secret,
            }),
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Failed to send webhook for tx ${tx.id}:`, error);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Webhooks reenviados: ${sentCount} sucesso, ${failedCount} falhas`,
      sent: sentCount,
      failed: failedCount,
      total: recentTransactions.length,
    });
  } catch (error) {
    console.error("Error resending webhooks:", error);
    return NextResponse.json(
      { error: "Erro ao reenviar webhooks" },
      { status: 500 }
    );
  }
}
