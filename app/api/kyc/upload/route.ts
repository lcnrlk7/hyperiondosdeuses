import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { encryptKycFile, ensureKycStorageSchema, isKycDocumentType } from "@/lib/kyc-storage";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    await ensureKycStorageSchema();

    const form = await request.formData();
    const file = form.get("file");
    const documentType = String(form.get("documentType") || "");
    if (!(file instanceof File) || !isKycDocumentType(documentType)) {
      return NextResponse.json({ error: "Arquivo ou tipo de documento inválido" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Use JPG, PNG ou WEBP com até 8 MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const signature = bytes.subarray(0, 12).toString("hex");
    const validSignature = signature.startsWith("ffd8ff") || signature.startsWith("89504e470d0a1a0a") || signature.startsWith("52494646");
    if (!validSignature) return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });

    const principal = await sql`SELECT COALESCE(parent_profile_id, id) AS id FROM profiles WHERE id = ${user.id} LIMIT 1`;
    const userId = principal[0]?.id || user.id;
    const encrypted = encryptKycFile(bytes);

    await sql`
      INSERT INTO kyc_documents (user_id, document_type, file_url, file_name, status, encrypted_data, encryption_iv, auth_tag, content_type, file_size, updated_at)
      VALUES (${userId}, ${documentType}, 'encrypted', ${file.name.slice(0, 180)}, 'pending', ${encrypted.encrypted}, ${encrypted.iv}, ${encrypted.tag}, ${file.type}, ${file.size}, NOW())
      ON CONFLICT (user_id, document_type) DO UPDATE SET
        file_url = 'encrypted', file_name = EXCLUDED.file_name, status = 'pending', rejection_reason = NULL,
        reviewed_by = NULL, reviewed_at = NULL, encrypted_data = EXCLUDED.encrypted_data,
        encryption_iv = EXCLUDED.encryption_iv, auth_tag = EXCLUDED.auth_tag,
        content_type = EXCLUDED.content_type, file_size = EXCLUDED.file_size, updated_at = NOW()
    `;

    const count = await sql`SELECT COUNT(DISTINCT document_type)::int AS count FROM kyc_documents WHERE user_id = ${userId} AND document_type IN ('document_front', 'document_back', 'selfie_with_document') AND encrypted_data IS NOT NULL`;
    if (count[0]?.count === 3) {
      await sql`UPDATE profiles SET kyc_status = 'pending', kyc_rejection_reason = NULL, updated_at = NOW() WHERE id = ${userId} AND kyc_status <> 'approved'`;
    }
    return NextResponse.json({ success: true, complete: count[0]?.count === 3 });
  } catch (error) {
    console.error("[KYC Upload]", error);
    return NextResponse.json({ error: "Não foi possível armazenar o documento" }, { status: 500 });
  }
}
