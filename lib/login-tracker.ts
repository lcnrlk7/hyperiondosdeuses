import { sql } from "@/lib/db";
import { headers } from "next/headers";

interface LoginData {
  userId: string;
  success: boolean;
}

function parseUserAgent(userAgent: string): { device: string; browser: string } {
  let device = "Desktop";
  let browser = "Desconhecido";

  // Detectar dispositivo
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    if (/iPad/i.test(userAgent)) {
      device = "Tablet";
    } else {
      device = "Mobile";
    }
  }

  // Detectar navegador
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/Firefox/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/Edg/i.test(userAgent)) {
    browser = "Edge";
  } else if (/Opera|OPR/i.test(userAgent)) {
    browser = "Opera";
  }

  return { device, browser };
}

export async function trackLogin(data: LoginData): Promise<void> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "Desconhecido";
    const { device, browser } = parseUserAgent(userAgent);

    await sql`
      INSERT INTO login_history (user_id, ip_address, user_agent, device_type, browser, success)
      VALUES (${data.userId}, ${ipAddress}, ${userAgent}, ${device}, ${browser}, ${data.success})
    `;
  } catch (error) {
    // Ignora erros silenciosamente (tabela pode nao existir)
    console.error("[v0] Error tracking login (non-blocking):", error);
  }
}

export async function checkNewDevice(userId: string): Promise<boolean> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "";

    // Verificar se ja logou deste dispositivo/IP
    const existing = await sql`
      SELECT id FROM login_history
      WHERE user_id = ${userId} 
      AND (ip_address = ${ipAddress} OR user_agent = ${userAgent})
      AND success = true
      LIMIT 1
    `;

    return existing.length === 0;
  } catch {
    return false;
  }
}
