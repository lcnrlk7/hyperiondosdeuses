import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const dbSql = sql;
  
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Get user's referral code
    const userResult = await sql`
      SELECT referral_code FROM profiles WHERE id = ${session.userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
    }

    let referralCode = userResult[0].referral_code;

    // Se o usuario nao tem codigo de referencia, gerar um
    if (!referralCode) {
      referralCode = `REF${session.userId.slice(0, 8).toUpperCase()}`;
      await sql`
        UPDATE profiles SET referral_code = ${referralCode} WHERE id = ${session.userId}
      `;
    }

    // Get affiliates (users referred by this user)
    const affiliates = await sql`
      SELECT 
        p.id,
        p.name,
        p.email,
        p.created_at,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) as total_transactions,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_volume
      FROM profiles p
      LEFT JOIN transactions t ON t.user_id = p.id
      WHERE p.referred_by = ${session.userId}
      GROUP BY p.id, p.name, p.email, p.created_at
      ORDER BY p.created_at DESC
    `;

    // Get commissions summary
    const commissionsSummary = await sql`
      SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(amount), 0) as total_earned,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount
      FROM affiliate_commissions
      WHERE affiliate_id = ${session.userId}
    `;

    // Get recent commissions
    const recentCommissions = await sql`
      SELECT 
        ac.id,
        ac.amount,
        ac.status,
        ac.created_at,
        p.name as referred_user_name,
        t.amount as transaction_amount
      FROM affiliate_commissions ac
      LEFT JOIN profiles p ON p.id = ac.referred_user_id
      LEFT JOIN transactions t ON t.id = ac.transaction_id
      WHERE ac.affiliate_id = ${session.userId}
      ORDER BY ac.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      referralCode,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hyperionpay.com.br'}/register?ref=${referralCode}`,
      affiliates,
      summary: commissionsSummary[0] || {
        total_commissions: 0,
        total_earned: 0,
        pending_amount: 0,
        paid_amount: 0
      },
      recentCommissions
    });
  } catch (error) {
    console.error("Erro ao buscar afiliados:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
