"use client"

import Image from "next/image"
import { useProfile } from "@/components/profile-provider"
import { NotificationCenter } from "./notification-center"
import { IpBadge } from "./ip-badge"

interface Profile {
  id: string
  email: string
  name: string | null
  is_admin: boolean
  balance: number
  avatar_url?: string | null
}

interface User {
  id: string
  email: string
}

interface HeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile: profileProp }: HeaderProps) {
  const { profile: ctxProfile } = useProfile()
  const profile = ctxProfile || profileProp

  const displayName = profile?.name || user.email?.split("@")[0] || "Usuario"
  const accountType = profile?.is_admin ? "Conta Empresarial" : "Conta Pessoal"
  const initial = (profile?.name || user.email || "U")[0]?.toUpperCase()

  return (
    <header className="hidden lg:flex h-16 bg-card border-b border-border items-center justify-end gap-4 px-8">
      <IpBadge />
      <NotificationCenter />

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">{accountType}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border">
          {profile?.avatar_url ? (
            <Image
              src={typeof profile.avatar_url === "string" ? profile.avatar_url : "/placeholder.svg"}
              alt={displayName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary font-bold">{initial}</span>
          )}
        </div>
      </div>
    </header>
  )
}
