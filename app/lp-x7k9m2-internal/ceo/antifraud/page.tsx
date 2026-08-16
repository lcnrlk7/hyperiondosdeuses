"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Ban, Loader2, Activity, Fingerprint } from "lucide-react";

interface AntifraudData {
  stats: { total: number; blocked: number; last24h: number; critical: number };
  bySeverity: { severity: string; count: number }[];
  byType: { attack_type: string; count: number }[];
  recent: Array<{
    id: string; attack_type: string; ip_address: string; user_email: string;
    endpoint: string; severity: string; blocked: boolean; created_at: string;
  }>;
  risk: { refused: number; refunded: number; total: number };
  suspiciousDocs: { document: string; refusedCount: number }[];
}

const severityColor: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function AntifraudPage() {
  const [data, setData] = useState<AntifraudData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/antifraud")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const refusalRate = data && data.risk.total > 0 ? ((data.risk.refused / data.risk.total) * 100).toFixed(1) : "0.0";

  const cards = [
    { label: "Ataques (total)", value: data?.stats.total ?? 0, icon: ShieldAlert, color: "text-red-400" },
    { label: "Bloqueados", value: data?.stats.blocked ?? 0, icon: ShieldCheck, color: "text-green-400" },
    { label: "Últimas 24h", value: data?.stats.last24h ?? 0, icon: Activity, color: "text-yellow-400" },
    { label: "Recusa 7d", value: `${refusalRate}%`, icon: AlertTriangle, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground text-balance">Antifraude</h1>
        <p className="text-muted-foreground">Monitoramento de ataques, recusas e sinais de risco</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentos suspeitos - dados reais */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-orange-400" />
            <h2 className="font-semibold text-foreground">Documentos com recusas repetidas (30d)</h2>
          </div>
          {data && data.suspiciousDocs.length > 0 ? (
            <div className="divide-y divide-white/5">
              {data.suspiciousDocs.map((s) => (
                <div key={s.document} className="p-4 flex items-center justify-between">
                  <span className="font-mono text-sm text-foreground">{s.document}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                    {s.refusedCount} recusas
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhum documento suspeito no período.</p>
          )}
        </div>

        {/* Ataques por tipo */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-foreground">Ataques por tipo</h2>
          </div>
          {data && data.byType.length > 0 ? (
            <div className="divide-y divide-white/5">
              {data.byType.map((t) => (
                <div key={t.attack_type} className="p-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">{t.attack_type}</span>
                  <span className="text-sm font-semibold text-foreground">{t.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhum ataque registrado. O sistema está monitorando.
            </p>
          )}
        </div>
      </div>

      {/* Eventos recentes */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Eventos recentes</h2>
        </div>
        {data && data.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">IP</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Endpoint</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Severidade</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="p-4 text-sm text-foreground">{e.attack_type}</td>
                    <td className="p-4 text-sm font-mono text-muted-foreground">{e.ip_address || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground truncate max-w-[200px]">{e.endpoint || "-"}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${severityColor[e.severity] || "bg-secondary text-muted-foreground"}`}>
                        {e.severity || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      {e.blocked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400"><Ban className="w-3 h-3" /> Bloqueado</span>
                      ) : (
                        <span className="text-xs text-yellow-400">Permitido</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{fmtDate(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhum ataque detectado</p>
            <p className="text-sm text-muted-foreground">O monitoramento antifraude está ativo e sem incidentes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
