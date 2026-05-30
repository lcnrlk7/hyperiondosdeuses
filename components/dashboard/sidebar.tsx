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
  MessageCircle,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  FileText,
  ArrowLeftRight,
  Percent,
  User,
  UserCircle,
  Users,
  Code,
  Settings,
  ShieldCheck,
  Shield,
  ShoppingCart,
  Package,
  Truck,
  Tag,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Send,
  Bot,
  Split,
  Activity,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationCenter } from "./notification-center"

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

// Menu organizado em categorias com cores
const menuCategories = [
  {
    title: "Visao Geral",
    color: "primary", // Laranja
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/wallet", icon: Wallet, label: "Carteira" },
      { href: "/dashboard/transfer", icon: Send, label: "Transferir" },
      { href: "/dashboard/split-payment", icon: Split, label: "Pag. Dividido" },
      { href: "/dashboard/transactions", icon: TrendingUp, label: "Transacoes" },
      { href: "/dashboard/reports", icon: FileText, label: "Relatorios" },
    ],
  },
  {
    title: "Conta",
    color: "emerald", // Verde
    items: [
      { href: "/dashboard/profile", icon: UserCircle, label: "Meu Perfil" },
      { href: "/dashboard/pix-keys", icon: ArrowLeftRight, label: "Chaves PIX" },
      { href: "/dashboard/fees", icon: Percent, label: "Taxas" },
      { href: "/dashboard/affiliates", icon: Users, label: "Afiliados" },
      { href: "/dashboard/telegram", icon: Bot, label: "Bot Telegram" },
    ],
  },
  {
    title: "E-commerce",
    color: "blue", // Azul
    hasSubmenu: true,
    items: [
      { href: "/dashboard/checkout", icon: ShoppingCart, label: "Meus Checkouts" },
      { href: "/dashboard/checkout/orders", icon: Truck, label: "Entregas" },
      { href: "/dashboard/checkout/products", icon: Package, label: "Produtos" },
      { href: "/dashboard/checkout/coupons", icon: Tag, label: "Cupons" },
    ],
  },
  {
    title: "Suporte",
    color: "cyan", // Ciano
    items: [
      { href: "/dashboard/support", icon: MessageCircle, label: "Tickets" },
      { href: "/dashboard/status", icon: Activity, label: "Status" },
    ],
  },
  {
    title: "Configuracoes",
    color: "purple", // Roxo
    items: [
      { href: "/dashboard/management", icon: FolderKanban, label: "Gestao" },
      { href: "/dashboard/integration", icon: Code, label: "Integracao API" },
      { href: "/dashboard/security", icon: Shield, label: "Seguranca" },
      { href: "/dashboard/settings", icon: Settings, label: "Preferencias" },
      { href: "/dashboard/white-label", icon: Globe, label: "White Label" },
    ],
  },
]

// Funcao para obter classes de cor
const getColorClasses = (color: string, isActive: boolean) => {
  const colors: Record<string, { label: string; active: string; hover: string; icon: string }> = {
    primary: {
      label: "text-primary/70",
      active: "bg-gradient-to-r from-primary/20 to-primary/5 text-primary border-l-2 border-primary shadow-sm shadow-primary/10",
      hover: "hover:bg-primary/5 hover:text-primary",
      icon: "text-primary",
    },
    emerald: {
      label: "text-emerald-500/70",
      active: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-l-2 border-emerald-500 shadow-sm shadow-emerald-500/10",
      hover: "hover:bg-emerald-500/5 hover:text-emerald-400",
      icon: "text-emerald-400",
    },
    blue: {
      label: "text-blue-500/70",
      active: "bg-gradient-to-r from-blue-500/20 to-blue-500/5 text-blue-400 border-l-2 border-blue-500 shadow-sm shadow-blue-500/10",
      hover: "hover:bg-blue-500/5 hover:text-blue-400",
      icon: "text-blue-400",
    },
    cyan: {
      label: "text-cyan-500/70",
      active: "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-l-2 border-cyan-500 shadow-sm shadow-cyan-500/10",
      hover: "hover:bg-cyan-500/5 hover:text-cyan-400",
      icon: "text-cyan-400",
    },
    purple: {
      label: "text-purple-500/70",
      active: "bg-gradient-to-r from-purple-500/20 to-purple-500/5 text-purple-400 border-l-2 border-purple-500 shadow-sm shadow-purple-500/10",
      hover: "hover:bg-purple-500/5 hover:text-purple-400",
      icon: "text-purple-400",
    },
    red: {
      label: "text-red-500/70",
      active: "bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-l-2 border-red-500 shadow-sm shadow-red-500/10",
      hover: "hover:bg-red-500/5 hover:text-red-400",
      icon: "text-red-400",
    },
  }
  return colors[color] || colors.primary
}

export function DashboardSidebar({ user, profile }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Auto-expand checkout menu if on checkout page
  const isCheckoutPage = pathname.startsWith("/dashboard/checkout")

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className={`border-b border-border ${collapsed ? "p-3" : "p-5"}`}>
        <Link href="/dashboard" className="flex items-center gap-3 group justify-center lg:justify-start">
          <Image
            src="/images/logo-hyperion.png"
            alt="Hyperion Pay"
            width={32}
            height={32}
          />
          {!collapsed && (
            <div className="flex items-baseline">
              <span className="text-lg font-bold text-foreground">Hyperion</span>
              <span className="text-lg font-bold text-primary">Pay</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? "p-2" : "p-4"} space-y-1 overflow-y-auto scrollbar-hide`}>
        {menuCategories.map((category, categoryIndex) => {
          const colorClasses = getColorClasses(category.color, false)
          const isEcommerce = category.title === "E-commerce"
          
          return (
            <div key={category.title} className={categoryIndex > 0 ? "pt-4" : "pt-2"}>
              {/* Category Title */}
              {!collapsed && (
                <div className="pb-2">
                  <span className={`px-4 text-[10px] font-semibold uppercase tracking-widest ${colorClasses.label}`}>
                    {category.title}
                  </span>
                </div>
              )}
              
              {/* E-commerce with submenu */}
              {isEcommerce && !collapsed ? (
                <div className="space-y-1">
                  <button
                    onClick={() => setCheckoutOpen(!checkoutOpen)}
                    className={`w-full group flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                      isCheckoutPage
                        ? colorClasses.active
                        : `text-muted-foreground ${colorClasses.hover}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className={`w-5 h-5 transition-transform duration-200 ${isCheckoutPage ? colorClasses.icon : "group-hover:scale-110"}`} />
                      <span className="font-medium">Checkout</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${checkoutOpen || isCheckoutPage ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {(checkoutOpen || isCheckoutPage) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 space-y-0.5 pt-1">
                          {category.items.map((item) => {
                            const isActive = pathname === item.href
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`group flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? colorClasses.active
                                    : `text-muted-foreground ${colorClasses.hover}`
                                }`}
                              >
                                <item.icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? colorClasses.icon : "group-hover:scale-110"}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : isEcommerce && collapsed ? (
                /* Collapsed E-commerce - only first item icon */
                <Link
                  href="/dashboard/checkout"
                  onClick={() => setIsMobileOpen(false)}
                  className={`group flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                    isCheckoutPage
                      ? colorClasses.active
                      : `text-muted-foreground ${colorClasses.hover}`
                  }`}
                  title="Checkout"
                >
                  <ShoppingCart className={`w-5 h-5 transition-transform duration-200 ${isCheckoutPage ? colorClasses.icon : "group-hover:scale-110"}`} />
                </Link>
              ) : (
                /* Regular menu items */
                category.items.map((item) => {
                  const isActive = pathname === item.href
                  const onboardingId = 
                    item.href === "/dashboard/wallet" ? "wallet-link" :
                    item.href === "/dashboard/integration" ? "api-link" :
                    item.href === "/dashboard/support" ? "support-link" :
                    undefined
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      data-onboarding={onboardingId}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center ${collapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"} rounded-xl transition-all duration-200 ${
                        isActive
                          ? colorClasses.active
                          : `text-muted-foreground ${colorClasses.hover}`
                      }`}
                    >
                      <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? colorClasses.icon : "group-hover:scale-110"}`} />
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  )
                })
              )}
            </div>
          )
        })}

        {/* KYC Link */}
        {profile?.kyc_status !== "approved" && (
          <Link
            href="/dashboard/kyc"
            onClick={() => setIsMobileOpen(false)}
            title={collapsed ? "Verificacao KYC" : undefined}
            className={`group flex items-center ${collapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"} rounded-xl transition-all duration-200 mt-2 ${
              pathname === "/dashboard/kyc"
                ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-l-2 border-yellow-500 shadow-sm shadow-yellow-500/10"
                : "text-yellow-500/70 hover:bg-yellow-500/5 hover:text-yellow-400"
            }`}
          >
            <User className={`w-5 h-5 transition-transform duration-200 ${pathname === "/dashboard/kyc" ? "text-yellow-400" : "group-hover:scale-110"}`} />
            {!collapsed && <span className="font-medium">Verificacao KYC</span>}
          </Link>
        )}

        {/* Admin */}
        {profile?.is_admin && (
          <div className="pt-4">
            {!collapsed && (
              <div className="pb-2">
                <span className="px-4 text-[10px] font-semibold text-red-500/70 uppercase tracking-widest">
                  Administracao
                </span>
              </div>
            )}
            <Link
              href="/lp-x7k9m2-internal/ceo"
              onClick={() => setIsMobileOpen(false)}
              title={collapsed ? "Painel CEO" : undefined}
              className={`group flex items-center ${collapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"} rounded-xl transition-all duration-200 ${
                pathname.startsWith("/lp-x7k9m2-internal")
                  ? "bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-l-2 border-red-500 shadow-sm shadow-red-500/10"
                  : "text-muted-foreground hover:bg-red-500/5 hover:text-red-400"
              }`}
            >
              <ShieldCheck className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/lp-x7k9m2-internal") ? "text-red-400" : "group-hover:scale-110"}`} />
              {!collapsed && <span className="font-medium">Painel CEO</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className={`${collapsed ? "p-2" : "p-4"} border-t border-border/50 bg-gradient-to-t from-black/50 to-transparent`}>
        {collapsed ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name || "Avatar"}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold">
                    {(profile?.name || user.email)?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name || "Avatar"}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold">
                    {(profile?.name || user.email)?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <NotificationCenter />
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        data-onboarding="sidebar"
        className={`hidden lg:flex ${isCollapsed ? "w-[72px]" : "w-64"} h-screen bg-card border-r border-border flex-col fixed left-0 top-0 transition-all duration-300`}
      >
        <SidebarContent collapsed={isCollapsed} />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shadow-sm"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Mobile Header Bar - Barra fixa no topo */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center justify-between px-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-secondary border border-border rounded-xl text-foreground flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Saldo e Notificacoes no mobile */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Saldo Liquido</p>
            <p className="text-sm font-bold text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(profile?.balance || 0))}
            </p>
          </div>
          <NotificationCenter />
        </div>
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
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 20 }}
              className="lg:hidden fixed left-0 top-0 w-72 h-screen bg-card border-r border-border flex flex-col z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* CSS Variable for content margin */}
      <style jsx global>{`
        :root {
          --sidebar-width: ${isCollapsed ? '72px' : '256px'};
        }
      `}</style>
    </>
  )
}
