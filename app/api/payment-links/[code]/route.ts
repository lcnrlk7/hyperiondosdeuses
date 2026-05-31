import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MedusaPayments } from "@/lib/acquirers/medusa";
import { getSystemFeesForUser } from "@/lib/acquirers";

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

    // Buscar profile do dono do link com adquirente
    const [profile] = await sql`
      SELECT 
        p.*,
        a.id as acquirer_id,
        a.code as acquirer_code,
        a.api_key as acquirer_api_key,
        a.api_secret as acquirer_api_secret,
        a.is_active as acquirer_active
      FROM profiles p
      LEFT JOIN acquirers a ON a.id = p.acquirer_id
      WHERE p.id = ${link.user_id}
    `;

    if (!profile) {
      return NextResponse.json(
        { error: "Vendedor nao encontrado" },
        { status: 404 }
      );
    }

    // Verificar se tem adquirente configurado
    if (!profile.acquirer_id || !profile.acquirer_active) {
      return NextResponse.json(
        { error: "Rota de pagamento nao configurada" },
        { status: 500 }
      );
    }

    // Buscar taxas do usuario
    const userFees = await getSystemFeesForUser(profile.id);
    const feePercentage = userFees.pixPercentageFee;
    const fixedFee = userFees.pixFixedFee;
    const fee = (finalAmount * (feePercentage / 100)) + fixedFee;
    const netAmount = finalAmount - fee;

    // Criar transacao pendente
    const txId = crypto.randomUUID();
    const transactionId = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const [transaction] = await sql`
      INSERT INTO transactions (
        id, user_id, type, status, amount, fee, net_amount,
        payer_name, payer_email, payer_document,
        description, external_id, metadata
      ) VALUES (
        ${txId}, ${link.user_id}, 'pix_in', 'pending', ${finalAmount}, ${fee}, ${netAmount},
        ${payer_name || null}, ${payer_email || null}, ${payer_cpf || null},
        ${`Pagamento via link: ${link.title}`}, ${transactionId},
        ${JSON.stringify({ payment_link_id: link.id, payment_link_code: link.code })}
      )
      RETURNING *
    `;

    // Gerar PIX via Medusa (mesmo padrao do /api/pix/create)
    let pixResult: { success: boolean; data?: { qrCode?: string; transactionId?: string }; error?: string };

    if (profile.acquirer_code === 'medusa' || profile.acquirer_code === 'medusa_white') {
      try {
        const medusa = new MedusaPayments({
          secretKey: profile.acquirer_api_key,
          licenseKey: profile.acquirer_api_secret || undefined,
        });
        
        const amountInCents = Math.round(finalAmount * 100);
        const customerName = payer_name || "Cliente";
        const customerDocument = payer_cpf ? payer_cpf.replace(/\D/g, "") : "36009722004";
        const customerEmail = payer_email || "cliente@hyperionpay.com";
        const medusaWebhookUrl = "https://www.hyperionpay.com.br/api/webhooks/medusa";
        
        const medusaResult = await medusa.createSimplePixPayment(
          amountInCents,
          customerName,
          customerDocument,
          customerEmail,
          `Pagamento: ${link.title}`,
          medusaWebhookUrl
        );
        
        if (!medusaResult.pix?.qrcode) {
          pixResult = {
            success: false,
            error: "Medusa nao retornou o codigo PIX"
          };
        } else {
          pixResult = {
            success: true,
            data: {
              qrCode: medusaResult.pix.qrcode,
              transactionId: String(medusaResult.id),
            }
          };
        }
      } catch (error) {
        console.error("Medusa error:", error);
        pixResult = {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar cobranca PIX"
        };
      }
    } else {
      pixResult = {
        success: false,
        error: `Adquirente nao suportada: ${profile.acquirer_code}`
      };
    }

    if (!pixResult.success || !pixResult.data) {
      // Marcar transacao como falha
      await sql`UPDATE transactions SET status = 'failed' WHERE id = ${txId}`;
      return NextResponse.json(
        { error: pixResult.error || "Erro ao gerar PIX" },
        { status: 500 }
      );
    }

    // Atualizar transacao com dados do PIX
    await sql`
      UPDATE transactions SET
        acquirer_transaction_id = ${pixResult.data.transactionId},
        metadata = metadata || ${JSON.stringify({ 
          qr_code: pixResult.data.qrCode,
          copy_paste: pixResult.data.qrCode 
        })}::jsonb
      WHERE id = ${txId}
    `;

    // Incrementar contador de usos do link
    await sql`
      UPDATE payment_links 
      SET current_uses = current_uses + 1, updated_at = NOW()
      WHERE id = ${link.id}
    `;

    return NextResponse.json({
      success: true,
      transaction_id: txId,
      amount: finalAmount,
      pix_code: pixResult.data.qrCode,
      qr_code: pixResult.data.qrCode,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Erro ao processar pagamento" },
      { status: 500 }
    );
  }
}
