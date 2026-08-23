import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { verifyDiditSignature } from "@/lib/didit";

// Mapeia o status da Didit para o status interno de liveness
function mapStatus(diditStatus: string): string | null {
  switch (diditStatus?.trim().toLowerCase().replaceAll("_", " ")) {
    case "approved":
      return "approved";
    case "declined":
      return "declined";
    case "in review":
      return "in_review";
    case "in progress":
      return "in_progress";
    case "resubmitted":
      return "resubmitted";
    case "kyc expired":
    case "expired":
      return "expired";
    case "abandoned":
      return "abandoned";
    default:
      return null; // "Not Started" | "Awaiting User" — sem acao
  }
}

export async function POST(request: NextRequest) {
  // Le o corpo bruto ANTES de qualquer parse (necessario para a assinatura)
  const raw = await request.text();
  const signatureV2 = request.headers.get("x-signature-v2") ?? "";
  const timestamp = Number(request.headers.get("x-timestamp"));

  // 1. Verifica frescor + assinatura HMAC-SHA256
  const check = verifyDiditSignature({ rawBody: raw, signatureV2, timestamp });
  if (!check.valid) {
    console.error("[v0] Webhook Didit rejeitado:", check.reason);
    return new Response(check.reason || "unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const eventId: string = payload.event_id;
  const sessionId: string | undefined = payload.session_id;
  const status: string = payload.status;
  const webhookType: string = payload.webhook_type;
  const vendorData: string | undefined = payload.vendor_data;

  // 2. Idempotencia — dedupe por event_id
  try {
    const inserted = await sql`
      INSERT INTO didit_webhook_events (event_id, session_id, status, webhook_type)
      VALUES (${eventId}, ${sessionId ?? null}, ${status ?? null}, ${webhookType ?? null})
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `;
    if (inserted.length === 0) {
      // Ja processado
      return new Response("ok");
    }
  } catch (e) {
    console.error("[v0] Erro ao registrar evento de webhook:", e);
    // Continua mesmo assim para nao perder a atualizacao
  }

  // 3. Aplica a decisao apenas para eventos de status de sessao
  if (webhookType === "status.updated" || webhookType === "data.updated") {
    const internalStatus = mapStatus(status);

    // 3a-i. Desafios faciais de step-up (login/saque). vendor_data = "challenge:<id>".
    // NAO altera o liveness/KYC do cadastro — apenas o status do desafio.
    if (vendorData && vendorData.startsWith("challenge:")) {
      const challengeId = vendorData.slice("challenge:".length);
      try {
        await sql`
          UPDATE face_challenges
          SET status = ${internalStatus ?? "pending"}
          WHERE id = ${challengeId}
             OR session_id = ${sessionId ?? null}
        `;
        console.log(
          `[face-auth] Webhook atualizou desafio ${challengeId} -> ${internalStatus}`,
        );
      } catch (e) {
        console.error("[v0] Erro ao atualizar desafio facial:", e);
      }
    } else if (internalStatus && (vendorData || sessionId)) {
      try {
        if (internalStatus === "approved") {
          // Usa vendor_data quando disponível e session_id como fallback. Alguns
          // formatos de webhook da Didit não repetem vendor_data no evento final.
          await sql`
            UPDATE profiles
            SET
              liveness_status = 'approved',
              liveness_verified_at = COALESCE(liveness_verified_at, NOW()),
              liveness_updated_at = NOW(),
              kyc_status = 'approved'
            WHERE (${vendorData ?? null}::text IS NOT NULL AND id = ${vendorData ?? null})
               OR (${sessionId ?? null}::text IS NOT NULL AND liveness_session_id = ${sessionId ?? null})
          `;
        } else {
          await sql`
            UPDATE profiles
            SET
              liveness_status = ${internalStatus},
              liveness_updated_at = NOW()
            WHERE (${vendorData ?? null}::text IS NOT NULL AND id = ${vendorData ?? null})
               OR (${sessionId ?? null}::text IS NOT NULL AND liveness_session_id = ${sessionId ?? null})
          `;
        }
      } catch (e) {
        console.error("[v0] Erro ao atualizar liveness do usuário:", e);
      }
    }
  }

  // 4. Retorna 2xx rapidamente
  return new Response("ok");
}
