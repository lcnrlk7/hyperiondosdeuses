import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Verificação externa removida. Use o KYC manual." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Verificação externa removida. Use o KYC manual." }, { status: 410 });
}
