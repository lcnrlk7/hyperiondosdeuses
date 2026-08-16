"use client";

import { useState, useEffect } from "react";
import { MonitorSmartphone, LogIn, XCircle, CheckCircle, Users, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SessionRow {
  id: string; user_id: string; ip_address: string; user_agent: string;
  created_at: string; updated_at: string; user_name: string; user_email: string;
}
interface LoginRow {
  id: string; ip_address: string; device_type: string; browser: string;
  location: string; success: boolean; created_at: string; user_name: string; user_email: string;
}
interface SessionsData {
  active: SessionRow[];
  logins: LoginRow[];
  stats: { activeSessions: number; logins24h: number; failed24h: number; uniqueUsers: number };
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function SessionsPage() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/sessions");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/admin/sessions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sessão revogada");
        await load();
      } else {
        toast.error("Erro ao revogar sessão");
      }
    } finally {
      setRevoking(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const cards = [
    { label: "Sessões ativas", value: data?.stats.activeSessions ?? 0, icon: MonitorSmartphone, color: "text-primary" },
    { label: "Logins 24h", value: data?.stats.logins24h ?? 0, icon: LogIn, color: "text-green-400" },
    { label: "Falhas 24h", value: data?.stats.failed24h ?? 0, icon: XCircle, color: "text-red-400" },
    { label: "Usuários únicos", value: data?.stats.uniqueUsers ?? 0, icon: Users, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground text-balance">Sessões</h1>
        <p className="text-muted-foreground">Sessões ativas e histórico de acessos</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary"><c.icon className={`w-5 h-5 ${c.color}`} /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sessoes ativas */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="font-semibold text-foreground">Sessões ativas</h2></div>
        {data && data.active.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Usuário</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">IP</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Dispositivo</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Atualizada</th>
                  <th className="text-right p-4 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.active.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="p-4">
                      <p className="text-sm text-foreground">{s.user_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{s.user_email}</p>
                    </td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">{s.ip_address || "-"}</td>
                    <td className="p-4 text-xs text-muted-foreground truncate max-w-[220px]">{s.user_agent || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{fmtDate(s.updated_at || s.created_at)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => revoke(s.id)}
                        disabled={revoking === s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm disabled:opacity-50"
                      >
                        {revoking === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma sessão ativa registrada.</p>
        )}
      </div>

      {/* Historico de login */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="font-semibold text-foreground">Histórico de login</h2></div>
        {data && data.logins.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.logins.map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {l.success ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{l.user_name || l.user_email || "Desconhecido"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[l.browser, l.device_type, l.location].filter(Boolean).join(" • ") || l.ip_address}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{fmtDate(l.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum registro de login ainda.</p>
        )}
      </div>
    </div>
  );
}
