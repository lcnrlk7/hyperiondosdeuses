import webpush from "web-push";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

function normalizeVapidPrivateKey(value: string | undefined): string {
  return (value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "")
    .replace(/=+$/g, "");
}

export function configureWebPush(subject = "mailto:contato@hyperionpay.com.br"): boolean {
  const privateKey = normalizeVapidPrivateKey(process.env.VAPID_PRIVATE_KEY);

  if (!privateKey || !/^[A-Za-z0-9_-]+$/.test(privateKey)) {
    console.error("VAPID_PRIVATE_KEY is missing or invalid");
    return false;
  }

  try {
    webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY, privateKey);
    return true;
  } catch (error) {
    console.error(
      "Unable to configure Web Push:",
      error instanceof Error ? error.message : "invalid VAPID configuration",
    );
    return false;
  }
}
