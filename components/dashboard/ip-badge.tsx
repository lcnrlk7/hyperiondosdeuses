"use client"

import { useState } from "react"
import useSWR from "swr"
import { MapPin, Eye, EyeOff, Loader2 } from "lucide-react"

interface IpInfo {
  ip: string
  location: string
  flag: string | null
  city: string | null
  country: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function IpBadge() {
  // Comeca borrado por padrao (privacidade). O usuario revela ao clicar.
  const [revealed, setRevealed] = useState(false)
  const { data, isLoading } = useSWR<IpInfo>("/api/user/ip", fetcher, {
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden sm:inline">Carregando IP...</span>
      </div>
    )
  }

  if (!data?.ip) return null

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />

      <div className="flex items-center gap-1.5 leading-none">
        <span
          className={`font-mono font-medium text-foreground transition-all duration-200 ${
            revealed ? "" : "select-none blur-sm"
          }`}
          aria-hidden={!revealed}
        >
          {data.ip}
        </span>
        {data.location && data.location !== "Rede local / desconhecido" && (
          <span
            className={`hidden text-muted-foreground transition-all duration-200 md:inline ${
              revealed ? "" : "select-none blur-sm"
            }`}
          >
            · {data.flag ? `${data.flag} ` : ""}
            {data.location}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="ml-0.5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={revealed ? "Ocultar IP" : "Mostrar IP"}
        title={revealed ? "Ocultar IP" : "Mostrar IP"}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
