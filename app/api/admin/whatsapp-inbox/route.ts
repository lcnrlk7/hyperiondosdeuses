import { NextResponse } from "next/server";
import { requireAdmin, accessDeniedResponse } from "@/lib/admin-auth";
import { listConversations } from "@/lib/whatsapp/conversations";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return accessDeniedResponse();

  try {
    const conversations = await listConversations(100);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[WhatsApp Inbox] Erro ao listar conversas:", error);
    return NextResponse.json(
      { error: "Erro ao listar conversas" },
      { status: 500 }
    );
  }
}
