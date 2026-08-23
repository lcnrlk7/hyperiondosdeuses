"use client"

import { useState } from "react"
import useSWR from "swr"
import { Building2, Search, UserRound, Wallet, ArrowLeftRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

const fetcher = (url: string) => fetch(url).then(async (response) => {
  if (!response.ok) throw new Error("Falha ao carregar subcontas")
  return response.json()
})

const money = (value: number | string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))

type Subaccount = {
  id: string
  account_name: string
  balance: number | string
  is_active: boolean
  created_at: string
  parent_id: string
  parent_name: string
  parent_email: string
  parent_document: string
  kyc_status: string
  total_sales: number | string
  transaction_count: number | string
  withdrawal_count: number | string
}

export default function AdminSubaccountsPage() {
  const [search, setSearch] = useState("")
  const { data, error, isLoading } = useSWR<{ subaccounts: Subaccount[] }>(
    `/api/admin/subaccounts?search=${encodeURIComponent(search)}`,
    fetcher,
  )

  const grouped = (data?.subaccounts || []).reduce<Record<string, { owner: Subaccount; accounts: Subaccount[] }>>((result, account) => {
    result[account.parent_id] ||= { owner: account, accounts: [] }
    result[account.parent_id].accounts.push(account)
    return result
  }, {})

  return (
    <main className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Gestao de usuarios</p>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Subcontas vinculadas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe contas financeiras isoladas vinculadas a cada titular.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar titular ou subconta" className="pl-9" />
        </div>
      </header>

      {isLoading && <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Nao foi possivel carregar as subcontas.</div>}
      {!isLoading && !error && Object.keys(grouped).length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium text-foreground">Nenhuma subconta encontrada</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {Object.values(grouped).map(({ owner, accounts }) => (
          <section key={owner.parent_id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><UserRound className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="font-semibold text-foreground">{owner.parent_name || "Titular sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{owner.parent_email} · {owner.parent_document || "Documento nao informado"}</p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{accounts.length} de 5 subcontas</span>
            </div>

            <div className="divide-y divide-border">
              {accounts.map((account) => (
                <article key={account.id} className="grid gap-4 p-4 md:grid-cols-[minmax(180px,1.3fr)_repeat(3,minmax(120px,1fr))] md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-foreground">{account.account_name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Criada em {new Date(account.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Saldo</p><p className="mt-1 font-semibold text-foreground">{money(account.balance)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Vendas</p><p className="mt-1 font-semibold text-foreground">{money(account.total_sales)}</p></div>
                  <div className="flex gap-4">
                    <div><Wallet className="h-4 w-4 text-muted-foreground" /><p className="mt-1 text-sm font-medium text-foreground">{account.withdrawal_count}</p><p className="text-xs text-muted-foreground">Saques</p></div>
                    <div><ArrowLeftRight className="h-4 w-4 text-muted-foreground" /><p className="mt-1 text-sm font-medium text-foreground">{account.transaction_count}</p><p className="text-xs text-muted-foreground">Transacoes</p></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
