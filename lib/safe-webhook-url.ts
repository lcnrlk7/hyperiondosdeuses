import dns from "node:dns/promises"
import net from "node:net"

function isPrivateIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number)
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    )
  }

  const normalized = address.toLowerCase().split("%")[0]
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  )
}

export async function validatePublicHttpsUrl(value: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error("URL invalida")
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Use uma URL HTTPS publica sem credenciais ou porta customizada")
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "")
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Destino local nao permitido")
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("IP privado ou reservado nao permitido")
    return url
  }

  const addresses = await dns.lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("O dominio resolve para uma rede privada ou reservada")
  }

  return url
}
