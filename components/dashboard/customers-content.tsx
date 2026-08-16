"use client";

import { useState, useMemo } from "react";
import { Users, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface Customer {
  name: string;
  document: string | null;
  email: string | null;
  total_spent: number;
  payments: number;
  last_payment: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const formatDate = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
};

const maskDoc = (doc: string | null) => {
  if (!doc) return "—";
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  if (digits.length === 14) return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/****-**`;
  return doc;
};

export function CustomersContent({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.document || "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  const totals = useMemo(() => {
    const revenue = customers.reduce((a, c) => a + Number(c.total_spent || 0), 0);
    const payments = customers.reduce((a, c) => a + Number(c.payments || 0), 0);
    return { revenue, payments };
  }, [customers]);

  const summary = [
    { label: "Clientes", value: new Intl.NumberFormat("pt-BR").format(customers.length), icon: Users },
    { label: "Pagamentos", value: new Intl.NumberFormat("pt-BR").format(totals.payments), icon: UserRound },
    { label: "Receita total", value: formatCurrency(totals.revenue), icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">Pessoas que pagaram voce, agrupadas por documento</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-primary mt-2">{s.value}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-base font-semibold text-foreground">Lista de clientes</h2>
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9 bg-secondary border-border"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {customers.length === 0 ? "Nenhum cliente ainda." : "Nenhum cliente encontrado."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Documento</th>
                  <th className="pb-3 font-medium">Pagamentos</th>
                  <th className="pb-3 font-medium">Total gasto</th>
                  <th className="pb-3 font-medium">Ultimo pagamento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={`${c.document || c.name}-${i}`} className="border-b border-border/60 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{c.name[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground font-medium truncate">{c.name}</p>
                          {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground font-mono text-xs">{maskDoc(c.document)}</td>
                    <td className="py-3 text-foreground">{new Intl.NumberFormat("pt-BR").format(Number(c.payments || 0))}</td>
                    <td className="py-3 font-medium text-foreground">{formatCurrency(Number(c.total_spent || 0))}</td>
                    <td className="py-3 text-muted-foreground text-xs">{formatDate(c.last_payment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
