"use client";

import { useAuth } from "@/components/auth-provider";
import { useProfile, ProfileProvider } from "@/components/profile-provider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { LivenessBlocker } from "@/components/dashboard/liveness-blocker";
import { NotificationListener } from "@/components/notification-listener";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Só redireciona se terminou de carregar E não tem token E ainda não redirecionou
    if (!authLoading && !token && !hasRedirected) {
      setHasRedirected(true);
      router.push("/auth/login");
    }
  }, [authLoading, token, router, hasRedirected]);

  if (authLoading || (token && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  const userForComponents = {
    id: user.id,
    email: user.email,
  };

  // Verificacao obrigatoria de prova de vida (Didit). Quando aprovada, o KYC e
  // liberado automaticamente, entao a prova de vida e o unico portao de acesso.
  const livenessStatus = (profile?.liveness_status as string) || "not_started";
  const isVerified = livenessStatus === "approved";

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {!isVerified && (
        <LivenessBlocker livenessStatus={livenessStatus} onRefresh={refreshProfile} />
      )}
      <NotificationListener userId={user.id} />
      <DashboardSidebar user={userForComponents} profile={profile} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0 lg:ml-[var(--sidebar-width,256px)] transition-all duration-300">
        <DashboardHeader user={userForComponents} profile={profile} />
        <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProfileProvider>
  );
}
