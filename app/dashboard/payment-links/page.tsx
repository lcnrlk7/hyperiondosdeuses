import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PaymentLinksManager } from "@/components/dashboard/payment-links-manager";

export const dynamic = "force-dynamic";

export default async function PaymentLinksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return <PaymentLinksManager />;
}
