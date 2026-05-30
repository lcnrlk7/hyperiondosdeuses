"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/lp-x7k9m2-internal/attendant", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/lp-x7k9m2-internal/attendant/users", icon: Users, label: "Buscar Usuário" },
  { href: "/lp-x7k9m2-internal/attendant/notes", icon: MessageSquare, label: "Notas Internas" },
];

export default function AttendantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      
      if (!data.user) {
        router.push("/lp-x7k9m2-internal");
        return;
      }

      // Check role via admin API
      const roleRes = await fetch("/api/admin/check-role");
      const roleData = await roleRes.json();

      if (!roleData.role || !["attendant", "manager", "ceo"].includes(roleData.role)) {
        router.push("/lp-x7k9m2-internal");
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/lp-x7k9m2-internal");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/lp-x7k9m2-internal");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/lp-x7k9m2-internal/attendant" className="flex items-center gap-3">
          <Image src="/images/logo-hyperion.png" alt="Hyperion Pay" width={40} height={40} />
          <div>
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-foreground">Hyperion</span>
              <span className="text-xl font-bold text-primary">Pay</span>
            </div>
            <span className="text-xs text-primary/80 flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              Atendente
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen glass flex-col fixed left-0 top-0 border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl text-foreground"
      >
        <Menu className="w-6 h-6" />
      </button>

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
              className="lg:hidden fixed left-0 top-0 w-72 h-screen glass flex flex-col z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
