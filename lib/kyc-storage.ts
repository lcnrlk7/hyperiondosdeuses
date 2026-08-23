import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db";
import { getJwtSecret } from "@/lib/jwt-secret";

export const KYC_DOCUMENT_TYPES = ["document_front", "document_back", "selfie_with_document"] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

const key = createHash("sha256")
  .update(Buffer.from(getJwtSecret()))
  .update("hyperionpay:kyc-documents:v1")
  .digest();

export function encryptKycFile(data: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return { encrypted, iv, tag: cipher.getAuthTag() };
}

export function decryptKycFile(encrypted: Buffer, iv: Buffer, tag: Buffer) {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

let schemaPromise: Promise<void> | null = null;
export function ensureKycStorageSchema() {
  if (!schemaPromise) schemaPromise = setupKycStorageSchema();
  return schemaPromise;
}

async function setupKycStorageSchema() {
  await sql`CREATE TABLE IF NOT EXISTS kyc_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    document_type text NOT NULL,
    file_url text NOT NULL DEFAULT 'encrypted',
    file_name text,
    status text NOT NULL DEFAULT 'pending',
    rejection_reason text,
    reviewed_by uuid,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS encrypted_data bytea`;
  await sql`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS encryption_iv bytea`;
  await sql`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS auth_tag bytea`;
  await sql`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS content_type text`;
  await sql`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS file_size integer`;
  await sql`ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS kyc_documents_user_type_unique ON kyc_documents(user_id, document_type)`;
  await sql`CREATE INDEX IF NOT EXISTS kyc_documents_review_queue_idx ON kyc_documents(status, created_at DESC)`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_rejection_reason text`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_reviewed_by text`;
  await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz`;
}

export function isKycDocumentType(value: string): value is KycDocumentType {
  return KYC_DOCUMENT_TYPES.includes(value as KycDocumentType);
}
