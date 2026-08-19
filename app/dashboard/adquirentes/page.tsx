"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion } from "framer-motion"
import {
  Landmark,
  Check,
  Loader2,
  Activity,
  Flame,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Loader2 as Spinner,
} from "lucide-react"

interface AcquirerItem {
  id: string
  name: string
  badge: string | null
  maxTicket: number
  deposits: number
  conversion: number
  volume: number
  selected: boolean
  isMostUsed: boolean
  isBestConversion: boolean
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0))

export default function AdquirentesPage() {
  const { data, isLoading, mutate } = useSWR<{
    acquirers: AcquirerItem[]
    selectedId: string | null
    autoRetry: boolean
  }>("/api/user/acquirers", fetcher)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [savingRetry, setSavingRetry] = useState(false)

  const acquirers = data?.acquirers ?? []
  const autoRetry = data?.autoRetry ?? false

  async function toggleAutoRetry() {
    const next = !autoRetry
    setSavingRetry(true)
    // Atualização otimista
    mutate({ ...(data as any), autoRetry: next }, false)
    try {
      await fetch("/api/user/acquirers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRetry: next }),
      })
      await mutate()
    } finally {
      setSavingRetry(false)
    }
  }

  async function selectAcquirer(id: string) {
    setSelecting(id)
    try {
      const res = await fetch("/api/user/acquirers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquirerId: id }),
      })
      if (res.ok) {
        await mutate()
      }
    } finally {
      setSelecting(null)
    }
  }

  async function testAcquirer(id: string) {
    setTesting(id)
    setTestResult((p) => ({ ...p, [id]: { ok: false, msg: "Testando conexão..." } }))
    try {
      const res = await fetch("/api/user/acquirers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquirerId: id }),
      })
      const result = await res.json()
      setTestResult((p) => ({
        ...p,
        [id]: result.success
          ? { ok: true, msg: `Funcional - resposta em ${result.latencyMs}ms` }
          : { ok: false, msg: result.error || "Falha no teste" },
      }))
    } catch {
      setTestResult((p) => ({ ...p, [id]: { ok: false, msg: "Erro de conexão" } }))
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 hidden sm:block">
          <Landmark className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 text-balance">Adquirentes</h1>
          <p className="text-muted-foreground text-pretty">
            Escolha por qual adquirente seus depósitos PIX serão processados. Compare o desempenho em tempo real
            e teste a disponibilidade antes de usar.
          </p>
        </div>
      </div>

      {/* Retentativa automática (fallback de adquirente) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">Retentativa automática</h3>
              <p className="text-sm text-muted-foreground text-pretty max-w-2xl">
                Se a adquirente escolhida falhar ao gerar o PIX, o sistema tenta automaticamente outra
                adquirente disponível — mesmo que não esteja selecionada — para não perder o depósito.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoRetry}
            onClick={toggleAutoRetry}
            disabled={savingRetry}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
              autoRetry ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span className="sr-only">Ativar retentativa automática</span>
            {savingRetry ? (
              <Spinner className="w-4 h-4 animate-spin text-primary-foreground mx-auto" />
            ) : (
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                  autoRetry ? "translate-x-6" : "translate-x-1"
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : acquirers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma adquirente disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {acquirers.map((a, index) => {
            const isSelected = a.selected
            const result = testResult[a.id]
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative flex flex-col rounded-2xl border p-5 transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {/* Selected marker */}
                {isSelected && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    Em uso
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {a.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                      {a.badge}
                    </span>
                  )}
                  {a.isMostUsed && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-bg text-warning">
                      <Flame className="w-3 h-3" />
                      Mais usada
                    </span>
                  )}
                  {a.isBestConversion && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-400/10 text-green-400">
                      <TrendingUp className="w-3 h-3" />
                      Melhor conversão
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-base font-semibold text-foreground leading-snug mb-1 text-pretty">
                  {a.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ticket até <span className="text-foreground font-medium">{formatCurrency(a.maxTicket)}</span>
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="text-lg font-bold text-foreground">{a.deposits}</p>
                    <p className="text-[11px] text-muted-foreground">Depósitos</p>
                  </div>
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="text-lg font-bold text-foreground">{a.conversion}%</p>
                    <p className="text-[11px] text-muted-foreground">Conversão</p>
                  </div>
                </div>

                {/* Conversion bar */}
                <div className="mb-4">
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, a.conversion)}%` }}
                    />
                  </div>
                </div>

                {/* Test result */}
                {result && (
                  <div
                    className={`flex items-center gap-1.5 text-xs mb-3 ${
                      result.ok ? "text-green-400" : result.msg.includes("Testando") ? "text-muted-foreground" : "text-destructive"
                    }`}
                  >
                    {result.msg.includes("Testando") ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : result.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {result.msg}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => selectAcquirer(a.id)}
                    disabled={isSelected || selecting === a.id}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary-dark"
                    }`}
                  >
                    {selecting === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        Selecionada
                      </>
                    ) : (
                      "Usar esta"
                    )}
                  </button>
                  <button
                    onClick={() => testAcquirer(a.id)}
                    disabled={testing === a.id}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                    title="Testar disponibilidade em tempo real"
                  >
                    {testing === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    Testar
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
