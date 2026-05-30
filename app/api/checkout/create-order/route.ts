import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { MedusaPayments } from "@/lib/acquirers/medusa";
import { notifyPixGenerated } from "@/lib/push-notifications";
import { getSystemFeesForUser } from "@/lib/acquirers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      checkout_id,
      seller_id,
      customer,
      items,
      subtotal,
      discount,
      total,
      coupon_code,
      payment_method,
    } = body;

    if (!checkout_id || !seller_id || !items || items.length === 0) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Customer pode ser vazio se nenhum campo for obrigatorio
    const customerData = customer || {};
    const customerName = customerData.name || "Cliente";
    const customerEmail = customerData.email || `cliente-${Date.now()}@checkout.local`;

    // Buscar dados do vendedor
    const sellerResult = await sql`
      SELECT id, name, email, cpf_cnpj, is_active, kyc_status, route_type, fee_percentage
      FROM profiles WHERE id = ${seller_id}
    `;

    if (sellerResult.length === 0) {
      return NextResponse.json({ error: "Vendedor nao encontrado" }, { status: 404 });
    }

    const seller = sellerResult[0];

    if (!seller.is_active) {
      return NextResponse.json({ error: "Vendedor inativo" }, { status: 403 });
    }

    // Create the order first
    const order = await sql`
      INSERT INTO checkout_orders (
        checkout_id, seller_id,
        customer_name, customer_email, customer_phone, customer_cpf,
        subtotal, discount, total,
        coupon_code, payment_method,
        payment_status, delivery_status, status
      ) VALUES (
        ${checkout_id}, ${seller_id},
        ${customerName}, ${customerEmail}, ${customerData.phone || null}, ${customerData.cpf || null},
        ${subtotal}, ${discount || 0}, ${total},
        ${coupon_code || null}, ${payment_method || 'pix'},
        'pending', 'pending', 'pending'
      )
      RETURNING *
    `;

    const orderId = order[0].id;

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO checkout_order_items (
          order_id, product_id, product_name, product_price, quantity, total
        ) VALUES (
          ${orderId}, ${item.product_id}, ${item.product_name},
          ${item.product_price}, ${item.quantity},
          ${item.product_price * item.quantity}
        )
      `;
    }

    // Update coupon usage if used
    if (coupon_code) {
      await sql`
        UPDATE checkout_coupons
        SET uses_count = uses_count + 1
        WHERE code = ${coupon_code}
      `;
    }

    // Generate PIX payment
    let pixResult: { 
      success: boolean; 
      data?: { 
        qrCode?: string; 
        qrCodeBase64?: string; 
        copyPaste?: string; 
        transactionId?: string;
      }; 
      error?: string 
    } = { success: false };

    // Buscar adquirente baseado na rota do vendedor
    const userRouteType = seller.route_type || 'black';
    const acquirerResult = await sql`
      SELECT * FROM acquirers WHERE is_active = true AND route_type = ${userRouteType} LIMIT 1
    `;

    if (acquirerResult.length > 0) {
      const acquirer = acquirerResult[0];
      const transactionId = `checkout_${orderId}_${Date.now()}`;
      const description = `Pedido #${orderId} - ${items.map((i: any) => i.product_name).join(', ')}`;

      if (acquirer.code === 'medusa' || acquirer.code === 'medusa_white') {
        try {
          const medusa = new MedusaPayments({
            secretKey: acquirer.api_key,
            licenseKey: acquirer.api_secret || undefined,
          });
          
          const amountInCents = Math.round(total * 100);
          const customerDocument = customer.cpf || "36009722004";
          const medusaWebhookUrl = "https://hyperionpay.com.br/api/webhooks/medusa";
          
          const medusaResult = await medusa.createSimplePixPayment(
            amountInCents,
            customer.name,
            customerDocument,
            customer.email,
            description,
            medusaWebhookUrl
          );
          
          if (medusaResult.pix?.qrcode) {
            pixResult = {
              success: true,
              data: {
                qrCode: medusaResult.pix.qrcode,
                qrCodeBase64: medusaResult.pix.qrcode,
                copyPaste: medusaResult.pix.qrcode,
                transactionId: String(medusaResult.id),
              }
            };
          }
        } catch (error) {
          console.error("[Checkout] Medusa error:", error);
        }
      }

      // Se gerou PIX, salvar na transacao
      if (pixResult.success && pixResult.data) {
        // Buscar taxas personalizadas do vendedor (ou padrao da rota)
        const userFees = await getSystemFeesForUser(seller_id);
        const feePercentage = userFees.pixPercentageFee;
        const fixedFee = userFees.pixFixedFee;
        const fee = (total * (feePercentage / 100)) + fixedFee;
        const netAmount = total - fee;
        
        console.log(`[Checkout] Vendedor ${seller.email}: Taxa ${feePercentage}% + R$${fixedFee} = R$${fee.toFixed(2)} para R$${total}`);
        
        const txId = crypto.randomUUID();
        
        // Criar transacao vinculada ao pedido
        await sql`
          INSERT INTO transactions (
            id, user_id, external_id, acquirer_transaction_id, type,
            amount, fee, net_amount, status,
            payer_name, payer_document, description, metadata, created_at
          )
          VALUES (
            ${txId}, ${seller_id}, ${`order_${orderId}`}, ${pixResult.data.transactionId || transactionId},
            'pix_in', ${total}, ${fee}, ${netAmount}, 'pending',
            ${customer.name}, ${customer.cpf || ''}, ${description},
            ${JSON.stringify({ 
              order_id: orderId,
              checkout_id,
              qr_code: pixResult.data.qrCode || '',
              copy_paste: pixResult.data.copyPaste || ''
            })}, NOW()
          )
        `;

        // Atualizar pedido com ID da transacao
        await sql`
          UPDATE checkout_orders 
          SET pix_transaction_id = ${txId}
          WHERE id = ${orderId}
        `;

        // Enviar notificacao push para o vendedor
        try {
          await notifyPixGenerated(seller_id, total, orderId, customerName);
        } catch (pushError) {
          console.error("[Checkout] Push notification error:", pushError);
        }
      }
    }

    // Registrar no log do admin
    await sql`
      INSERT INTO admin_logs (type, action, title, description, user_id, amount, metadata)
      VALUES (
        'checkout_order',
        'created',
        ${'Nova venda: ' + items.map((i: any) => i.product_name).join(', ')},
        ${'Cliente: ' + customerName + ' - ' + customerEmail},
        ${seller_id},
        ${total / 100},
        ${JSON.stringify({
          order_id: orderId,
          checkout_id,
          customer_name: customerName,
          customer_email: customerEmail,
          items: items.map((i: any) => ({ name: i.product_name, price: i.product_price })),
          pix_generated: pixResult.success
        })}
      )
    `;

    return NextResponse.json({ 
      success: true, 
      order_id: orderId,
      order: order[0],
      pix: pixResult.success ? {
        qrCode: pixResult.data?.qrCode,
        qrCodeBase64: pixResult.data?.qrCodeBase64,
        copyPaste: pixResult.data?.copyPaste,
      } : null
    });
  } catch (error) {
    console.error("[API] Error creating order:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
