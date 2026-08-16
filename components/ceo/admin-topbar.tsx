"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, User, Settings, ShieldCheck, LogOut, Clock } from "lucide-react";

interface AdminNotification {
  id: string | number;
  title?: string;
  message?: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
  profiles?: { name?: string; email?: string } | null;
}

const roleLabels: Record<string, string> = {
  ceo: "CEO",
  manager: "Gerente",
  support: "Suporte",
  finance: "Financeiro",
  tech: "Técnico",
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export function AdminTopbar({
  adminUser,
  adminRole,
  sessionTimeLeft,
  onLogout,
}: {
  adminUser: string;
  adminRole: string;
  sessionTimeLeft: string;
  onLogout: () => void;
}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.notifications)) {
          setNotifications(data.notifications.slice(0, 8));
        }
      } catch {
        // silencioso: sino degrada para 0
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const initials = (adminUser || "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-end gap-3 border-b border-border bg-card/80 px-8 backdrop-blur-sm">
      {/* Timer de sessão */}
      <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5">
        <Clock className="h-3.5 w-3.5 text-yellow-500" />
        <span className="text-xs font-medium text-yellow-500">{sessionTimeLeft || "24h 00m"}</span>
      </div>

      {/* Sino de notificações */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setNotifOpen((o) => !o);
            setProfileOpen(false);
          }}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Notificações</span>
              <Link
                href="/lp-x7k9m2-internal/ceo/notifications"
                onClick={() => setNotifOpen(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex gap-3 border-b border-border/50 px-4 py-3 last:border-0 hover:bg-secondary/50"
                  >
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.is_read ? "bg-transparent" : "bg-primary"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {n.title || "Notificação"}
                      </p>
                      {n.message && (
                        <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu de perfil */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => {
            setProfileOpen((o) => !o);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2.5 rounded-xl border border-border bg-background py-1.5 pl-1.5 pr-3 transition-colors hover:bg-secondary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold capitalize leading-tight text-foreground">{adminUser}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {roleLabels[adminRole] || adminRole}
            </p>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-semibold capitalize text-foreground">{adminUser}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[adminRole] || adminRole}</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/lp-x7k9m2-internal/ceo/team"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Meu perfil
              </Link>
              <Link
                href="/lp-x7k9m2-internal/ceo/logs"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Segurança
              </Link>
              <Link
                href="/lp-x7k9m2-internal/ceo/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Configurações
              </Link>
            </div>
            <div className="border-t border-border p-1.5">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
