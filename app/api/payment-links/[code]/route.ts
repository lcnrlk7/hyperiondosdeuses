import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET - Buscar payment link por codigo (publico)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const [link] = await sql`
      SELECT 
        pl.*,
        p.name as seller_name,
        p.avatar_url as seller_avatar
      FROM payment_links pl
      JOIN profiles p ON pl.user_id = p.id
      WHERE pl.code = ${code}
    `;

    if (!link) {
      return NextResponse.json(
        { error: "Link nao encontrado" },
        { status: 404 }
      );
    }

    // Verificar se esta ativo
    if (link.status !== "active") {
      return NextResponse.json(
        { error: "Este link de pagamento esta inativo" },
        { status: 400 }
      );
    }

    // Verificar se expirou
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Este link de pagamento expirou" },
        { status: 400 }
      );
    }

    // Verificar limite de usos
    if (link.max_uses && link.current_uses >= link.max_uses) {
      return NextResponse.json(
        { error: "Este link atingiu o limite maximo de usos" },
        { status: 400 }
      );
    }

    // Remover informacoes sensiveis
    const publicLink = {
      id: link.id,
      code: link.code,
      title: link.title,
      description: link.description,
      amount: link.amount,
      amount_type: link.amount_type,
      min_amount: link.min_amount,
      max_amount: link.max_amount,
      logo_url: link.logo_url,
      primary_color: link.primary_color,
      background_color: link.background_color,
      success_message: link.success_message,
      require_name: link.require_name,
      require_email: link.require_email,
      require_phone: link.require_phone,
      require_cpf: link.require_cpf,
      seller_name: link.seller_name,
      seller_avatar: link.seller_avatar,
    };

    return NextResponse.json({ link: publicLink });
  } catch (error) {
    console.error("Error fetching payment link:", error);
    return NextResponse.json(
      { error: "Erro ao buscar link de pagamento" },
      { status: 500 }
    );
  }
}

// POST - Criar transacao de pagamento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { amount, payer_name, payer_email, payer_phone, payer_cpf } = body;

    // Buscar link
    const [link] = await sql`
      SELECT * FROM payment_links WHERE code = ${code}
    `;

    if (!link) {
      return NextResponse.json(
        { error: "Link nao encontrado" },
        { status: 404 }
      );
    }

    // Validacoes
    if (link.status !== "active") {
      return NextResponse.json(
        { error: "Este link de pagamento esta inativo" },
        { status: 400 }
      );
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Este link de pagamento expirou" },
        { status: 400 }
      );
    }

    if (link.max_uses && link.current_uses >= link.max_uses) {
      return NextResponse.json(
        { error: "Este link atingiu o limite maximo de usos" },
        { status: 400 }
      );
    }

    // Determinar valor
    let finalAmount = amount;
    if (link.amount_type === "fixed") {
      finalAmount = Number(link.amount);
    } else {
      // Valor aberto - validar limites
      if (link.min_amount && finalAmount < Number(link.min_amount)) {
        return NextResponse.json(
          { error: `Valor minimo: R$ ${Number(link.min_amount).toFixed(2)}` },
          { status: 400 }
        );
      }
      if (link.max_amount && finalAmount > Number(link.max_amount)) {
        return NextResponse.json(
          { error: `Valor maximo: R$ ${Number(link.max_amount).toFixed(2)}` },
          { status: 400 }
        );
      }
    }

    // Validar campos obrigatorios
    if (link.require_name && !payer_name) {
      return NextResponse.json({ error: "Nome e obrigatorio" }, { status: 400 });
    }
    if (link.require_email && !payer_email) {
      return NextResponse.json({ error: "Email e obrigatorio" }, { status: 400 });
    }
    if (link.require_phone && !payer_phone) {
      return NextResponse.json({ error: "Telefone e obrigatorio" }, { status: 400 });
    }
    if (link.require_cpf && !payer_cpf) {
      return NextResponse.json({ error: "CPF e obrigatorio" }, { status: 400 });
    }

    // Buscar configuracao do usuario para taxas
    const [profile] = await sql`
      SELECT 
        p.*,
        COALESCE(p.custom_fee_percentage, 
          COALESCE((SELECT value::numeric FROM system_settings WHERE key = 'pix_percentage_fee'), 2.99)
        ) as fee_percentage,
        COALESCE(p.custom_fixed_fee, 
          COALESCE((SELECT value::numeric FROM system_settings WHERE key = 'pix_fixed_fee'), 0)
        ) as fixed_fee
      FROM profiles p WHERE p.id = ${link.user_id}
    `;

    const feePercentage = Number(profile.fee_percentage);
    const fixedFee = Number(profile.fixed_fee);
    const fee = (finalAmount * feePercentage / 100) + fixedFee;
    const netAmount = finalAmount - fee;

    // Criar transacao pendente
    const [transaction] = await sql`
      INSERT INTO transactions (
        user_id, type, status, amount, fee, net_amount,
        payer_name, payer_email, payer_cpf,
        description, payment_link_id
      ) VALUES (
        ${link.user_id}, 'pix_in', 'pending', ${finalAmount}, ${fee}, ${netAmount},
        ${payer_name || null}, ${payer_email || null}, ${payer_cpf || null},
        ${`Pagamento via link: ${link.title}`}, ${link.id}
      )
      RETURNING *
    `;

    // Gerar PIX via Medusa ou adquirente
    const medusaUrl = process.env.MEDUSA_API_URL || "https://api.medusa.com.br";
    const medusaSecret = process.env.MEDUSA_SECRET_KEY || process.env.MEDUSA_API_KEY;

    if (!medusaSecret) {
      console.error("Medusa API key not configured");
      return NextResponse.json(
        { error: "Erro de configuracao do sistema" },
        { status: 500 }
      );
    }

    // Gerar CPF valido se nao fornecido
    const cpfToUse = payer_cpf || "00000000000";

    const medusaPayload = {
      value: Math.round(finalAmount * 100), // Em centavos
      externalId: transaction.id,
      customer: {
        name: payer_name || "Cliente",
        document: cpfToUse.replace(/\D/g, ""),
        email: payer_email || "cliente@email.com",
      },
      description: `Pagamento: ${link.title}`,
    };

    const medusaResponse = await fetch(`${medusaUrl}/v1/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${medusaSecret}`,
      },
      body: JSON.stringify(medusaPayload),
    });

    if (!medusaResponse.ok) {
      const errorText = await medusaResponse.text();
      console.error("Medusa error:", errorText);
      
      // Atualizar transacao como falhou
      await sql`UPDATE transactions SET status = 'failed' WHERE id = ${transaction.id}`;
      
      return NextResponse.json(
        { error: "Erro ao gerar PIX" },
        { status: 500 }
      );
    }

    const medusaData = await medusaResponse.json();

    // Atualizar transacao com dados do PIX
    await sql`
      UPDATE transactions SET
        external_id = ${medusaData.id || medusaData.invoiceId},
        pix_code = ${medusaData.emvqrcps || medusaData.pixCode || medusaData.qrcode},
        qr_code = ${medusaData.qrCodeImage || medusaData.qrcodeBase64 || null}
      WHERE id = ${transaction.id}
    `;

    return NextResponse.json({
      transaction_id: transaction.id,
      amount: finalAmount,
      pix_code: medusaData.emvqrcps || medusaData.pixCode || medusaData.qrcode,
      qr_code: medusaData.qrCodeImage || medusaData.qrcodeBase64,
      expires_at: medusaData.expiresAt,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}
