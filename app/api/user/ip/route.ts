import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientIP } from "@/lib/security";
import { lookupGeoLocation } from "@/lib/geo-ip";

/**
 * Retorna o IP atual da sessao e sua localizacao aproximada.
 * Usado no topo do dashboard do usuario.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const ip = await getClientIP();
    const geo = await lookupGeoLocation(ip);

    return NextResponse.json({
      ip: geo.ip,
      location: geo.label,
      flag: geo.flag || null,
      city: geo.city || null,
      country: geo.country || null,
    });
  } catch (error) {
    console.error("[user/ip] error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
