"use client"

import { useState, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

// Context for sidebar state
const SidebarContext = createContext<{ isCollapsed: boolean; setIsCollapsed: (v: boolean) => void }>({ isCollapsed: false, setIsCollapsed: () => {} })
export const useSidebar = () => useContext(SidebarContext)

import {
  LogOut,
  Menu,
  X,
  Headphones,
  LayoutDashboard,
  ArrowLeftRight,
  Banknote,
  Users,
  ReceiptText,
  Link2,
  Landmark,
  FileBarChart,
  Code2,
  Settings,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/components/profile-provider"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
  api_key?: string
  kyc_status?: string
  avatar_url?: string | null
}

interface User {
  id: string
  email: string
}

interface SidebarProps {
  user: User
  profile: Profile | null
}

type MenuItem = {
  href: string
  icon: typeof LayoutDashboard
  label: string
  exact?: boolean
  beta?: boolean
}

const menuItems: MenuItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/transactions", icon: ArrowLeftRight, label: "Transacoes" },
  { href: "/dashboard/withdrawals", icon: Banknote, label: "Saques" },
  { href: "/dashboard/adquirentes", icon: Landmark, label: "Adquirentes" },
  { href: "/dashboard/customers", icon: Users, label: "Clientes" },
  { href: "/dashboard/charges", icon: ReceiptText, label: "Cobrancas" },
  { href: "/dashboard/payment-links", icon: Link2, label: "Links de Pagamento", beta: true },
  { href: "/dashboard/reports", icon: FileBarChart, label: "Relatorios" },
  { href: "/dashboard/integration", icon: Code2, label: "Integracoes" },
  { href: "/dashboard/settings", icon: Settings, label: "Configuracoes" },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0))

export function DashboardSidebar({ user, profile: profileProp }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showBalance, setShowBalance] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { profile: ctxProfile } = useProfile()

  const profile = ctxProfile || profileProp
  const balance = Number(profile?.balance ?? profileProp?.balance ?? 0)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  const isActive = (item: MenuItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"))

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={36} height={36} />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-tight">
              <span className="text-foreground">HYPERION </span>
              <span className="text-primary">PAY</span>
            </span>
            <span className="text-[11px] text-muted-foreground">Gateway de Pagamentos</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-accent text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.beta && (
                <span className="ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-warning-bg text-warning tracking-wide">
                  Beta
                </span>
              )}
            </Link>
          )
        })}

        {/* KYC pendente */}
        {profile?.kyc_status && profile.kyc_status !== "approved" && (
          <Link
            href="/dashboard/kyc"
            onClick={() => setIsMobileOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mt-1 ${
              pathname === "/dashboard/kyc"
                ? "bg-warning-bg text-warning font-semibold"
                : "text-warning/80 hover:bg-warning-bg"
            }`}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Verificacao KYC</span>
          </Link>
        )}

        {/* Admin */}
        {profile?.is_admin && (
          <Link
            href="/lp-x7k9m2-internal/ceo"
            onClick={() => setIsMobileOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mt-1 ${
              pathname.startsWith("/lp-x7k9m2-internal")
                ? "bg-accent text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Painel CEO</span>
          </Link>
        )}
      </nav>

      {/* Balance + actions */}
      <div className="px-3 pb-3 space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Saldo disponivel</span>
            <button
              onClick={() => setShowBalance((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xl font-bold text-foreground mb-3">
            {showBalance ? formatCurrency(balance) : "R$ ••••••"}
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
            <Link href="/dashboard/withdrawals" onClick={() => setIsMobileOpen(false)}>
              Sacar agora
            </Link>
          </Button>
        </div>

        <Link
          href="/dashboard/support"
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-accent/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Headphones className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Suporte 24/7</p>
            <p className="text-xs text-muted-foreground truncate">Fale com nosso time</p>
          </div>
        </Link>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        data-onboarding="sidebar"
        className="hidden lg:flex w-64 h-screen bg-sidebar border-r border-border flex-col fixed left-0 top-0"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-secondary border border-border rounded-xl text-foreground flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold tracking-tight">
            <span className="text-foreground">HYPERION </span>
            <span className="text-primary">PAY</span>
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-overlay backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 22 }}
              className="lg:hidden fixed left-0 top-0 w-72 h-screen bg-sidebar border-r border-border flex flex-col z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground z-10"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* CSS Variable for content margin */}
      <style jsx global>{`
        :root {
          --sidebar-width: 256px;
        }
      `}</style>
    </>
  )
}
