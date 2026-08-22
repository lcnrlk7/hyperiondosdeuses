import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Seguro",
  description: "Pagamento seguro e rapido via PIX",
  icons: {
    icon: "/checkout-favicon.png",
    shortcut: "/checkout-favicon.png",
    apple: "/checkout-favicon.png",
  },
};

export default function PaymentLinkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
