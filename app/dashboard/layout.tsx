import { AuthProvider } from "@/components/auth-provider";
import { DashboardLayoutWrapper } from "@/components/dashboard/dashboard-layout-wrapper";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PushNotificationPrompt } from "@/components/dashboard/push-notification-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light bg-background text-foreground min-h-screen">
      <AuthProvider>
        <OnboardingProvider>
          <ServiceWorkerRegister />
          <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
          <OnboardingOverlay />
          <KeyboardShortcuts />
          <PWAInstallPrompt />
          <PushNotificationPrompt />
        </OnboardingProvider>
      </AuthProvider>
    </div>
  );
}
