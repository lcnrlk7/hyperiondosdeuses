"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  fee: number | string;
  status: string;
  created_at: string;
  user_name?: string | null;
  user_email?: string | null;
  payer_name?: string | null;
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const typeLabel = (type: string) => {
  switch (type) {
    case "pix_in":
      return "PIX Recebido";
    case "pix_out":
      return "PIX Enviado";
    case "deposit":
      return "Depósito";
    case "withdrawal":
      return "Saque";
    case "transfer_in":
      return "Transf. Entrada";
    case "transfer_out":
      return "Transf. Saída";
    default:
      return "PIX";
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return { label: "Aprovado", cls: "bg-green-500/10 text-green-600" };
    case "pending":
      return { label: "Pendente", cls: "bg-amber-500/10 text-amber-600" };
    case "processing":
      return { label: "Processando", cls: "bg-blue-500/10 text-blue-600" };
    case "failed":
      return { label: "Recusado", cls: "bg-red-500/10 text-red-600" };
    case "cancelled":
      return { label: "Cancelado", cls: "bg-slate-500/10 text-slate-500" };
    default:
      return { label: status, cls: "bg-slate-500/10 text-slate-500" };
  }
};

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Transações Recentes</h2>
        <Link
          href="/lp-x7k9m2-internal/ceo/transactions"
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Ver todas
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Usuário</th>
                <th className="px-5 py-3 font-medium">Método</th>
                <th className="px-5 py-3 font-medium">Valor</th>
                <th className="px-5 py-3 font-medium">Taxa</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => {
                const badge = statusBadge(tx.status);
                const user = tx.user_email || tx.user_name || tx.payer_name || "Usuário";
                return (
                  <tr key={tx.id} className="transition-colors hover:bg-secondary/60">
                    <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                      #{tx.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px] truncate text-muted-foreground">
                      {user}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
                          <Zap className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                        {typeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {formatBRL(Number(tx.amount))}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {formatBRL(Number(tx.fee))}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
