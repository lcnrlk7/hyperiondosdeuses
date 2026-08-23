"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Building2, Check, ChevronDown, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Account = {
  id: string
  account_name: string
  balance: number | string
  total_sales: number | string
  is_primary: boolean
}

type AccountsResponse = { accounts: Account[]; limit: number }

const fetcher = (url: string) => fetch(url).then(async (response) => {
  if (!response.ok) throw new Error("Nao foi possivel carregar as contas")
  return response.json()
})

const money = (value: number | string) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(Number(value || 0))

export function AccountSwitcher({ activeAccountId }: { activeAccountId: string }) {
  const { data, error, isLoading, mutate } = useSWR<AccountsResponse>("/api/user/accounts", fetcher)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const active = useMemo(
    () => data?.accounts.find((account) => account.id === activeAccountId) || data?.accounts[0],
    [activeAccountId, data],
  )
  const subaccountCount = data?.accounts.filter((account) => !account.is_primary).length || 0

  async function switchAccount(accountId: string) {
    if (accountId === activeAccountId) return setOpen(false)
    setBusyId(accountId)
    const response = await fetch("/api/user/accounts/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ account_id: accountId }),
    })
    if (response.ok) window.location.assign("/dashboard")
    else {
      setMessage("Nao foi possivel alternar a conta")
      setBusyId(null)
    }
  }

  async function createAccount() {
    setMessage("")
    if (name.trim().length < 3) return setMessage("Use pelo menos 3 caracteres")
    setBusyId("create")
    const response = await fetch("/api/user/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ account_name: name }),
    })
    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error || "Nao foi possivel criar a conta")
      setBusyId(null)
      return
    }
    setName("")
    setCreating(false)
    setBusyId(null)
    await mutate()
  }

  return (
    <div className="relative border-b border-border px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-accent"
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {isLoading ? "Carregando contas..." : active?.account_name || "Conta principal"}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Suas contas</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar seletor">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {error && <p className="px-3 py-4 text-sm text-destructive">Erro ao carregar contas.</p>}
            {data?.accounts.map((account) => {
              const selected = account.id === activeAccountId
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => switchAccount(account.id)}
                  disabled={Boolean(busyId)}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${selected ? "bg-primary/10" : "hover:bg-accent"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{account.account_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{account.is_primary ? "Conta principal" : "Conta vinculada"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Saldo {money(account.balance)} · Vendas {money(account.total_sales)}</p>
                  </div>
                  {busyId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : selected ? <Check className="h-4 w-4 text-primary" /> : null}
                </button>
              )
            })}
          </div>

          <div className="border-t border-border p-3">
            {creating ? (
              <div className="flex flex-col gap-2">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova conta" maxLength={80} autoFocus />
                {message && <p className="text-xs text-destructive">{message}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={createAccount} disabled={busyId === "create"}>
                    {busyId === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar conta
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCreating(true)}
                disabled={subaccountCount >= (data?.limit || 5)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {subaccountCount >= (data?.limit || 5) ? "Limite de 5 subcontas" : "Criar subconta"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
