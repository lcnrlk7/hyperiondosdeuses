import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { decryptKycFile, ensureKycStorageSchema } from "@/lib/kyc-storage";
import { verifyKycReviewer } from "@/lib/kyc-reviewer-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const reviewer = await verifyKycReviewer();
  if (!reviewer) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  await ensureKycStorageSchema();
  const { documentId } = await params;
  const rows = await sql`SELECT encrypted_data, encryption_iv, auth_tag, content_type FROM kyc_documents WHERE id = ${documentId} LIMIT 1`;
  const doc = rows[0];
  if (!doc?.encrypted_data || !doc?.encryption_iv || !doc?.auth_tag) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  try {
    const body = decryptKycFile(Buffer.from(doc.encrypted_data), Buffer.from(doc.encryption_iv), Buffer.from(doc.auth_tag));
    return new NextResponse(body, { headers: {
      "Content-Type": doc.content_type || "application/octet-stream",
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return NextResponse.json({ error: "Documento corrompido ou chave inválida" }, { status: 500 });
  }
}
