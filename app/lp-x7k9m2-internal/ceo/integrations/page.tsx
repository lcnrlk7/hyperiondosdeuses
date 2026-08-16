"use client";

import { useState, useEffect } from "react";
import { Blocks, Loader2, Server, Globe } from "lucide-react";

interface Integration {
  id: string; name: string; description: string | null; website_url: string | null;
  client_id: string | null; webhook_url: string | null; is_active: boolean;
  created_at: string; owner_name: string | null; owner_email: string | null;
}
interface Acquirer {
  id: string; name: string; code: string; is_active: boolean;
  health_status: string | null; priority: number | null; route_type: string | null;
}
interface Data {
  integrations: Integration[];
  acquirers: Acquirer[];
  stats: { total: number; active: number };
}

const healthColor: Record<string, string> = {
  healthy: "bg-green-500/10 text-green-400",
  degraded: "bg-yellow-500/10 text-yellow-400",
  down: "bg-red-500/10 text-red-400",
};

export default function IntegrationsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/integrations");
    const d = await res.json();
    setData(d);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(i: Integration) {
    await fetch("/api/admin/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: i.id, is_active: !i.is_active }),
    });
    await load();
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground text-balance">Integrações</h1>
        <p className="text-muted-foreground">Aplicações conectadas e adquirentes de pagamento</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4"><p className="text-xl font-bold text-foreground">{data?.stats.total ?? 0}</p><p className="text-xs text-muted-foreground">Integrações</p></div>
        <div className="glass rounded-2xl p-4"><p className="text-xl font-bold text-green-400">{data?.stats.active ?? 0}</p><p className="text-xs text-muted-foreground">Ativas</p></div>
        <div className="glass rounded-2xl p-4"><p className="text-xl font-bold text-foreground">{data?.acquirers.length ?? 0}</p><p className="text-xs text-muted-foreground">Adquirentes</p></div>
      </div>

      {/* Adquirentes - integracoes de gateway reais */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Adquirentes conectados</h2>
        </div>
        {data && data.acquirers.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.acquirers.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.name} <span className="text-xs text-muted-foreground font-mono">({a.code})</span></p>
                  <p className="text-xs text-muted-foreground">{a.route_type || "rota padrão"}{a.priority != null ? ` • prioridade ${a.priority}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.health_status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${healthColor[a.health_status] || "bg-secondary text-muted-foreground"}`}>
                      {a.health_status}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                    {a.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum adquirente cadastrado.</p>
        )}
      </div>

      {/* Integracoes de usuarios */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Blocks className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Aplicações de clientes</h2>
        </div>
        {data && data.integrations.length > 0 ? (
          <div className="divide-y divide-white/5">
            {data.integrations.map((i) => (
              <div key={i.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {i.owner_email || "sem dono"}{i.website_url ? ` • ${i.website_url}` : ""}
                  </p>
                  {i.client_id && <p className="text-[11px] font-mono text-muted-foreground truncate">client_id: {i.client_id}</p>}
                </div>
                <button
                  onClick={() => toggle(i)}
                  className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${i.is_active ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}
                >
                  {i.is_active ? "Ativa" : "Inativa"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhuma aplicação conectada</p>
            <p className="text-sm text-muted-foreground">As integrações criadas pelos clientes aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
