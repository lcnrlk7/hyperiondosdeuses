import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET - Criar tabela payment_links
export async function GET() {
  try {
    // Criar tabela payment_links
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

    // Verificar se precisa adicionar coluna payment_link_id em transactions
    await sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id)
    `;

    return NextResponse.json({ 
      success: true, 
      message: "Tabela payment_links criada com sucesso!" 
    });
  } catch (error) {
    console.error("Error creating payment_links table:", error);
    return NextResponse.json(
      { error: "Erro ao criar tabela", details: String(error) },
      { status: 500 }
    );
  }
}
