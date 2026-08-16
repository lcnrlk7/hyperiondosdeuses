"use client";

import { useState, useEffect } from "react";
import { Shield, Users, DollarSign, Headphones, Code, Loader2, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PERMISSION_GROUPS, ROLE_DEFS } from "@/lib/permissions-catalog";

type RolesMap = Record<string, Record<string, boolean>>;

const roleIcons: Record<string, React.ReactNode> = {
  ceo: <Shield className="w-5 h-5" />,
  manager: <Users className="w-5 h-5" />,
  finance: <DollarSign className="w-5 h-5" />,
  support: <Headphones className="w-5 h-5" />,
  tech: <Code className="w-5 h-5" />,
};

const roleColors: Record<string, string> = {
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RolesMap>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string>("manager");

  async function load() {
    const res = await fetch("/api/admin/roles");
    const d = await res.json();
    setRoles(d.roles || {});
    setCounts(d.counts || {});
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function togglePerm(roleKey: string, permKey: string) {
    setRoles((prev) => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], [permKey]: !prev[roleKey]?.[permKey] },
    }));
  }

  async function saveRole(roleKey: string) {
    setSavingRole(roleKey);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey, permissions: roles[roleKey] }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "Erro ao salvar"); return; }
      toast.success("Permissões atualizadas e propagadas aos membros");
    } finally {
      setSavingRole(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const activeDef = ROLE_DEFS.find((r) => r.key === activeRole)!;
  const activePerms = roles[activeRole] || {};
  const grantedCount = Object.values(activePerms).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground text-balance">Cargos & Permissões</h1>
        <p className="text-muted-foreground">Controle de acesso por cargo (RBAC). Alterações são aplicadas aos membros do cargo.</p>
      </header>

      {/* Seletor de cargos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ROLE_DEFS.map((r) => {
          const isActive = r.key === activeRole;
          return (
            <button
              key={r.key}
              onClick={() => setActiveRole(r.key)}
              className={`glass rounded-2xl p-4 text-left transition-all ${isActive ? "ring-2 ring-primary" : "hover:bg-secondary/50"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${roleColors[r.color]}`}>{roleIcons[r.key]}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{counts[r.key] || 0} membro(s)</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor de permissoes do cargo ativo */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              {roleIcons[activeRole]} {activeDef.label}
              {!activeDef.editable && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" /> somente leitura</span>}
            </h2>
            <p className="text-xs text-muted-foreground">{activeDef.description} • {grantedCount} permissões ativas</p>
          </div>
          {activeDef.editable && (
            <Button onClick={() => saveRole(activeRole)} disabled={savingRole === activeRole} className="shrink-0">
              {savingRole === activeRole ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          )}
        </div>

        {!activeDef.editable ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            O cargo CEO tem acesso total e não pode ser alterado.
          </p>
        ) : (
          <div className="p-4 space-y-6">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{group.category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.permissions.map((perm) => {
                    const on = !!activePerms[perm.key];
                    return (
                      <button
                        key={perm.key}
                        onClick={() => togglePerm(activeRole, perm.key)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors text-left ${on ? "bg-primary/10 border-primary/30" : "bg-secondary border-border"}`}
                      >
                        <span className={`text-sm ${on ? "text-foreground" : "text-muted-foreground"}`}>{perm.label}</span>
                        <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-primary" : "bg-muted-foreground/30"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
