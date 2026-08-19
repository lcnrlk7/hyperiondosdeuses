import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Listar TODOS os payment links da plataforma (admin)
export async function GET() {
  try {
    // Garantir que a tabela existe (mesmo schema do endpoint do usuario)
    await sql`
      CREATE TABLE IF NOT EXISTS payment_links (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id),
        code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2),
        amount_type VARCHAR(20) DEFAULT 'fixed',
        min_amount DECIMAL(10,2),
        max_amount DECIMAL(10,2),
        logo_url TEXT,
        primary_color VARCHAR(20) DEFAULT '#f97316',
        background_color VARCHAR(20) DEFAULT '#0a0a0a',
        expires_at TIMESTAMP,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        success_message TEXT,
        redirect_url TEXT,
        require_name BOOLEAN DEFAULT true,
        require_email BOOLEAN DEFAULT true,
        require_phone BOOLEAN DEFAULT false,
        require_cpf BOOLEAN DEFAULT false,
        total_received DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const links = await sql`
      SELECT
        pl.id,
        pl.code,
        pl.title,
        pl.description,
        pl.amount,
        pl.amount_type,
        pl.expires_at,
        pl.max_uses,
        pl.current_uses,
        pl.status,
        pl.total_received,
        pl.created_at,
        p.email AS user_email,
        p.name AS user_name
      FROM payment_links pl
      LEFT JOIN profiles p ON pl.user_id = p.id
      ORDER BY pl.created_at DESC
      LIMIT 1000
    `;

    return NextResponse.json(
      { links: links || [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Error fetching all payment links:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
