import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Integração Didit desativada. O KYC é exclusivamente manual." },
    { status: 410 },
  );
}
