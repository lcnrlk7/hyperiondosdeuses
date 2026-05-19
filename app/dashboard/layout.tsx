import { AuthProvider } from "@/components/auth-provider";
import { DashboardLayoutWrapper } from "@/components/dashboard/dashboard-layout-wrapper";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { HyperionAssistant } from "@/components/hyperion-assistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <ServiceWorkerRegister />
        <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
        <OnboardingOverlay />
        <KeyboardShortcuts />
        <HyperionAssistant />
      </OnboardingProvider>
    </AuthProvider>
  );
}
