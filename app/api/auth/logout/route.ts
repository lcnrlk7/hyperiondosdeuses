import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";
import { clearActiveAccountCookie } from "@/lib/multi-account";

export async function POST() {
  try {
    await removeAuthCookie();
    await clearActiveAccountCookie();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error in logout:", error);
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 }
    );
  }
}
