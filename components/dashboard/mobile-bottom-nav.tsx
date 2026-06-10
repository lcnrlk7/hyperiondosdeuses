"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings, ArrowUpRight, Code } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
      </svg>
    ),
    label: "Inicio",
    exact: true,
  },
  {
    href: "/dashboard/transactions",
    icon: <FileText className="w-5 h-5" />,
    label: "Extrato",
  },
  {
    href: "/dashboard/wallet",
    icon: <ArrowUpRight className="w-6 h-6 text-primary-foreground" />,
    label: "",
    isCenter: true,
  },
  {
    href: "/dashboard/integration",
    icon: <Code className="w-5 h-5" />,
    label: "Integracoes",
  },
  {
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5" />,
    label: "Ajustes",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border px-4 py-2 z-40">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href} className="relative -mt-6">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  {item.icon}
                </div>
              </Link>
            );
          }

          const active = isActive(item.href, item.exact);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
