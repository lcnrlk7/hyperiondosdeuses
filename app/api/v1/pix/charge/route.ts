import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { createPixPayment, getSystemFeesForUser } from "@/lib/acquirers"
import { assertUserVerified } from "@/lib/kyc-guard"

// Funcao para extrair credenciais do request
function extractCredentials(request: NextRequest): { clientId: string | null; clientSecret: string | null; apiKey: string | null } {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6)
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
      const [clientId, clientSecret] = credentials.split(":")
      if (clientId && clientSecret) return { clientId, clientSecret, apiKey: null }
    } catch { /* ignorar */ }
  }
  
  const headerClientId = request.headers.get("x-client-id") || request.headers.get("client-id")
  const headerClientSecret = request.headers.get("x-client-secret") || request.headers.get("client-secret")
  if (headerClientId && headerClientSecret) return { clientId: headerClientId, clientSecret: headerClientSecret, apiKey: null }
  
  const apiKey = request.headers.get("x-api-key")
  if (apiKey) return { clientId: null, clientSecret: null, apiKey }
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7)
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      const [clientId, clientSecret] = decoded.split(":")
      if (clientId && clientSecret) return { clientId, clientSecret, apiKey: null }
    } catch { /* ignorar */ }
  }
  
  return { clientId: null, clientSecret: null, apiKey: null }
}

// Criar cobrança PIX
export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret, apiKey } = extractCredentials(request)
    
    let profile = null
    
    // Tentar autenticar via client_id/client_secret primeiro
    if (clientId && clientSecret) {
      const profiles = await sql`
        SELECT * FROM profiles 
        WHERE ((client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret}))
          AND is_active = true
      `
      profile = profiles[0]
    }
    // Senao, tentar via api_key
    else if (apiKey) {
      const profiles = await sql`
        SELECT * FROM profiles WHERE api_key = ${apiKey} AND is_active = true
      `
      profile = profiles[0]
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou conta inativa" },
        { status: 401 }
      )
    }

    // SEGURANCA: exige KYC manual aprovado antes de gerar cobranca.
    const denied = await assertUserVerified(profile.id)
    if (denied) return denied

    const body = await request.json()
    const { amount, description, payer_name, payer_document } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor inválido" },
        { status: 400 }
      )
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: "Valor mínimo é R$ 1,00" },
        { status: 400 }
      )
    }

    if (amount > 50000) {
      return NextResponse.json(
        { error: "Valor máximo é R$ 50.000,00" },
        { status: 400 }
      )
    }

    // Buscar taxas baseadas na rota do usuário
    const systemFees = await getSystemFeesForUser(profile.id)
    
    // Calcular taxa
    const feePercentage = systemFees.pixPercentageFee
    const fixedFee = systemFees.pixFixedFee
    const percentageFee = (amount * feePercentage) / 100
    const fee = percentageFee + fixedFee
    const netAmount = amount - fee

    const chargeId = `charge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Criar cobrança PIX usando a adquirente correta para a rota do usuário
    const pixResponse = await createPixPayment(
      amount,
      chargeId,
      profile.id,
      description || `Pagamento via ${profile.name}`,
      payer_name || "Cliente",
      payer_document || "00000000000"
    )

    if (!pixResponse.success) {
      return NextResponse.json(
        { error: pixResponse.error || "Erro ao criar cobrança PIX" },
        { status: 500 }
      )
    }

    // Salvar cobrança no banco
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + 30)

    const qrCode = pixResponse.qrCode || pixResponse.data?.qrCode || ''
    const qrCodeBase64 = pixResponse.qrCodeBase64 || pixResponse.data?.qrCodeBase64 || ''
    const copyPaste = pixResponse.copyPaste || pixResponse.data?.copyPaste || qrCode
    
    const charges = await sql`
      INSERT INTO pix_charges (
        user_id, amount, description, expiration, 
        copy_paste, qr_code, qr_code_base64, external_id, 
        payer_name, payer_document, status
      )
      VALUES (
        ${profile.id}, 
        ${amount},
        ${description || null}, 
        ${expirationDate.toISOString()}, 
        ${copyPaste},
        ${qrCode},
        ${qrCodeBase64},
        ${chargeId},
        ${payer_name || 'Cliente'},
        ${payer_document || '00000000000'},
        'active'
      )
      RETURNING *
    `
    const charge = charges[0]

    // Log da API
    await sql`
      INSERT INTO api_logs (user_id, endpoint, method, request_body, response_status, ip_address)
      VALUES (${profile.id}, '/api/v1/pix/charge', 'POST', ${JSON.stringify(body)}, 200, ${request.headers.get("x-forwarded-for") || "unknown"})
    `

    return NextResponse.json({
      success: true,
      data: {
        id: charge.id,
        external_id: charge.external_id,
        amount: Number(charge.amount),
        fee: fee,
        net_amount: netAmount,
        description: charge.description,
        status: charge.status,
        route: profile.route_type,
        pix: {
          qr_code: charge.qr_code,
          qr_code_base64: charge.qr_code_base64,
          copy_paste: charge.copy_paste,
        },
        expiration: charge.expiration,
        created_at: charge.created_at
      }
    })
  } catch (error) {
    console.error("[PIX Charge] Error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Listar cobranças
export async function GET(request: NextRequest) {
  try {
    const { clientId, clientSecret, apiKey } = extractCredentials(request)
    
    let profile = null
    
    if (clientId && clientSecret) {
      const profiles = await sql`
        SELECT * FROM profiles 
        WHERE ((client_id = ${clientId} AND client_secret = ${clientSecret})
           OR (api_key = ${clientId} AND client_secret = ${clientSecret}))
          AND is_active = true
      `
      profile = profiles[0]
    } else if (apiKey) {
      const profiles = await sql`
        SELECT * FROM profiles WHERE api_key = ${apiKey} AND is_active = true
      `
      profile = profiles[0]
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let charges
    if (status) {
      charges = await sql`
        SELECT * FROM pix_charges 
        WHERE user_id = ${profile.id} AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      charges = await sql`
        SELECT * FROM pix_charges 
        WHERE user_id = ${profile.id}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({
      success: true,
      data: charges,
      pagination: {
        limit,
        offset,
        total: charges.length
      }
    })
  } catch (error) {
    console.error("[v0] PIX charge list error:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
