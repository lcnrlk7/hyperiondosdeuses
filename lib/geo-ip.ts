/**
 * Geolocalizacao de IP usando ip-api.com (gratuito, sem chave de API).
 * Usado para enriquecer os logs de login com a localizacao aproximada.
 */

export interface GeoLocation {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  /** String pronta para exibir, ex.: "Sao Paulo, SP - Brasil" */
  label: string;
  /** Emoji de bandeira do pais, quando disponivel */
  flag?: string;
}

// IPs locais/privados nao tem geolocalizacao publica
function isLocalIp(ip: string): boolean {
  if (!ip || ip === "unknown" || ip === "Desconhecido") return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip.startsWith("fe80:")
  );
}

// Converte codigo de pais (ISO alpha-2) em emoji de bandeira
function countryCodeToFlag(code?: string): string | undefined {
  if (!code || code.length !== 2) return undefined;
  try {
    return String.fromCodePoint(
      ...code
        .toUpperCase()
        .split("")
        .map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)),
    );
  } catch {
    return undefined;
  }
}

/**
 * Consulta a localizacao de um IP. Nunca lanca excecao — em caso de erro,
 * retorna um label generico para nao quebrar o fluxo de login.
 */
export async function lookupGeoLocation(ip: string): Promise<GeoLocation> {
  const cleanIp = (ip || "").trim();

  if (isLocalIp(cleanIp)) {
    return { ip: cleanIp || "desconhecido", label: "Rede local / desconhecido" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,countryCode,regionName,city,isp,query&lang=pt-BR`,
      { signal: controller.signal, cache: "no-store" },
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return { ip: cleanIp, label: "Localizacao indisponivel" };
    }

    const data = await res.json();
    if (data.status !== "success") {
      return { ip: cleanIp, label: "Localizacao indisponivel" };
    }

    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    const flag = countryCodeToFlag(data.countryCode);
    const label = parts.length > 0 ? parts.join(", ") : "Localizacao indisponivel";

    return {
      ip: data.query || cleanIp,
      city: data.city,
      region: data.regionName,
      country: data.country,
      countryCode: data.countryCode,
      isp: data.isp,
      label,
      flag,
    };
  } catch {
    return { ip: cleanIp, label: "Localizacao indisponivel" };
  }
}
