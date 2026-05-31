import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET - Listar payment links do usuario
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    // Criar tabela se nao existir
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
      SELECT * FROM payment_links 
      WHERE user_id = ${payload.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ links });
  } catch (error) {
    console.error("Error fetching payment links:", error);
    return NextResponse.json(
      { error: "Erro ao buscar links de pagamento" },
      { status: 500 }
    );
  }
}

// POST - Criar novo payment link
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      amount,
      amount_type = "fixed",
      min_amount,
      max_amount,
      logo_url,
      primary_color = "#f97316",
      background_color = "#0a0a0a",
      expires_at,
      max_uses,
      success_message,
      redirect_url,
      require_name = true,
      require_email = true,
      require_phone = false,
      require_cpf = false,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Titulo e obrigatorio" },
        { status: 400 }
      );
    }

    if (amount_type === "fixed" && (!amount || amount <= 0)) {
      return NextResponse.json(
        { error: "Valor deve ser maior que zero para links com valor fixo" },
        { status: 400 }
      );
    }

    // Gerar codigo unico
    const code = nanoid(10);

    const [link] = await sql`
      INSERT INTO payment_links (
        user_id, code, title, description, amount, amount_type,
        min_amount, max_amount, logo_url, primary_color, background_color,
        expires_at, max_uses, success_message, redirect_url,
        require_name, require_email, require_phone, require_cpf
      ) VALUES (
        ${payload.id}, ${code}, ${title}, ${description || null},
        ${amount || null}, ${amount_type}, ${min_amount || null}, ${max_amount || null},
        ${logo_url || null}, ${primary_color}, ${background_color},
        ${expires_at ? new Date(expires_at) : null}, ${max_uses || null},
        ${success_message || null}, ${redirect_url || null},
        ${require_name}, ${require_email}, ${require_phone}, ${require_cpf}
      )
      RETURNING *
    `;

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Error creating payment link:", error);
    return NextResponse.json(
      { error: "Erro ao criar link de pagamento" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar payment link
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do link e obrigatorio" },
        { status: 400 }
      );
    }

    // Verificar se o link pertence ao usuario
    const [existingLink] = await sql`
      SELECT id FROM payment_links WHERE id = ${id} AND user_id = ${payload.id}
    `;

    if (!existingLink) {
      return NextResponse.json(
        { error: "Link nao encontrado" },
        { status: 404 }
      );
    }

    const [link] = await sql`
      UPDATE payment_links SET
        title = COALESCE(${updates.title}, title),
        description = COALESCE(${updates.description}, description),
        amount = COALESCE(${updates.amount}, amount),
        amount_type = COALESCE(${updates.amount_type}, amount_type),
        min_amount = COALESCE(${updates.min_amount}, min_amount),
        max_amount = COALESCE(${updates.max_amount}, max_amount),
        logo_url = COALESCE(${updates.logo_url}, logo_url),
        primary_color = COALESCE(${updates.primary_color}, primary_color),
        background_color = COALESCE(${updates.background_color}, background_color),
        expires_at = COALESCE(${updates.expires_at ? new Date(updates.expires_at) : null}, expires_at),
        max_uses = COALESCE(${updates.max_uses}, max_uses),
        success_message = COALESCE(${updates.success_message}, success_message),
        redirect_url = COALESCE(${updates.redirect_url}, redirect_url),
        require_name = COALESCE(${updates.require_name}, require_name),
        require_email = COALESCE(${updates.require_email}, require_email),
        require_phone = COALESCE(${updates.require_phone}, require_phone),
        require_cpf = COALESCE(${updates.require_cpf}, require_cpf),
        status = COALESCE(${updates.status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Error updating payment link:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar link de pagamento" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir payment link
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do link e obrigatorio" },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM payment_links 
      WHERE id = ${id} AND user_id = ${payload.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment link:", error);
    return NextResponse.json(
      { error: "Erro ao excluir link de pagamento" },
      { status: 500 }
    );
  }
}
