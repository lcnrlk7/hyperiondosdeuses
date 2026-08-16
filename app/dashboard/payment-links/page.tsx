import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PaymentLinksBeta } from "@/components/dashboard/payment-links-beta";

export const dynamic = "force-dynamic";

export default async function PaymentLinksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return <PaymentLinksBeta />;
}
