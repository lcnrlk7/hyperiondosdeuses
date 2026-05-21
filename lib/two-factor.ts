import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { sql } from "@/lib/db";
import crypto from "crypto";

const APP_NAME = "Hyperion Pay";

// Criar objeto TOTP
function createTOTP(secret: string, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

// Gerar secret para 2FA
export function generateSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

// Gerar URL para QR Code
export function generateQRCodeURL(email: string, secret: string): string {
  const totp = createTOTP(secret, email);
  return totp.toString();
}

// Gerar imagem QR Code em base64
export async function generateQRCodeImage(email: string, secret: string): Promise<string> {
  const otpauth = generateQRCodeURL(email, secret);
  return QRCode.toDataURL(otpauth);
}

// Verificar codigo TOTP
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

// Gerar codigos de backup
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Verificar codigo de backup
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT backup_codes FROM two_factor_auth WHERE user_id = ${userId}
    `;

    if (result.length === 0 || !result[0].backup_codes) {
      return false;
    }

    const backupCodes: string[] = result[0].backup_codes;
    const normalizedCode = code.toUpperCase().replace(/\s/g, "");
    const index = backupCodes.findIndex(c => c.replace("-", "") === normalizedCode.replace("-", ""));

    if (index === -1) {
      return false;
    }

    // Remover codigo usado
    backupCodes.splice(index, 1);
    await sql`
      UPDATE two_factor_auth SET backup_codes = ${backupCodes} WHERE user_id = ${userId}
    `;

    return true;
  } catch (error) {
    console.error("[v0] Error verifying backup code:", error);
    return false;
  }
}

// Verificar se 2FA esta ativado para usuario
export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT is_enabled FROM two_factor_auth WHERE user_id = ${userId}
    `;
    return result.length > 0 && result[0].is_enabled === true;
  } catch (error) {
    console.error("[v0] Error checking 2FA status:", error);
    return false; // Se der erro (tabela nao existe), assume que 2FA nao esta ativado
  }
}

// Obter secret do usuario
export async function getUserSecret(userId: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT secret FROM two_factor_auth WHERE user_id = ${userId} AND is_enabled = true
    `;
    return result.length > 0 ? result[0].secret : null;
  } catch (error) {
    console.error("[v0] Error getting user secret:", error);
    return null;
  }
}

// Iniciar setup de 2FA (gerar secret mas nao ativar ainda)
export async function setup2FA(userId: string, email: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
  const secret = generateSecret();
  const qrCode = await generateQRCodeImage(email, secret);
  const backupCodes = generateBackupCodes();

  // Salvar ou atualizar (ainda nao ativado)
  await sql`
    INSERT INTO two_factor_auth (user_id, secret, backup_codes, is_enabled)
    VALUES (${userId}, ${secret}, ${backupCodes}, false)
    ON CONFLICT (user_id) 
    DO UPDATE SET secret = ${secret}, backup_codes = ${backupCodes}, is_enabled = false, updated_at = NOW()
  `;

  return { secret, qrCode, backupCodes };
}

// Ativar 2FA apos verificacao do codigo
export async function enable2FA(userId: string, token: string): Promise<boolean> {
  const result = await sql`
    SELECT secret FROM two_factor_auth WHERE user_id = ${userId}
  `;

  if (result.length === 0) {
    return false;
  }

  const secret = result[0].secret;
  const isValid = verifyTOTP(secret, token);

  if (isValid) {
    await sql`
      UPDATE two_factor_auth 
      SET is_enabled = true, verified_at = NOW(), updated_at = NOW() 
      WHERE user_id = ${userId}
    `;
  }

  return isValid;
}

// Desativar 2FA
export async function disable2FA(userId: string): Promise<void> {
  await sql`
    DELETE FROM two_factor_auth WHERE user_id = ${userId}
  `;
}
