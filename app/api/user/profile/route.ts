import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // The dashboard cookie resolves the selected subaccount. Bearer auth remains
    // available for API clients that do not have a browser session.
    let user = await getCurrentUser();
    const authHeader = request.headers.get("authorization");
    if (!user && authHeader?.startsWith("Bearer ")) {
      user = await verifyToken(authHeader.slice(7));
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT child.id,
             COALESCE(child.account_name, child.name) as name,
             COALESCE(parent.email, child.email) as email,
             COALESCE(parent.phone, child.phone) as phone,
             COALESCE(parent.cpf_cnpj, child.cpf_cnpj) as cpf,
             COALESCE(parent.kyc_status, child.kyc_status) as kyc_status,
             child.created_at, child.route_type, child.balance, child.api_key,
             COALESCE(parent.avatar_url, child.avatar_url) as avatar_url,
             COALESCE(parent.bio, child.bio) as bio,
             COALESCE(parent.liveness_status, child.liveness_status) as liveness_status,
             COALESCE(parent.liveness_verified_at, child.liveness_verified_at) as liveness_verified_at
      FROM profiles child
      LEFT JOIN profiles parent ON parent.id::text = child.parent_profile_id
      WHERE child.id = ${user.id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    const profile = result[0];

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        cpf: profile.cpf,
        email_verified: true,
        kyc_status: profile.kyc_status,
        created_at: profile.created_at,
        route_type: profile.route_type,
        balance: Number(profile.balance) || 0,
        api_key: profile.api_key,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        liveness_status: profile.liveness_status || "not_started",
        liveness_verified_at: profile.liveness_verified_at,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // The dashboard cookie resolves the selected subaccount. Bearer auth remains
    // available for API clients that do not have a browser session.
    let user = await getCurrentUser();
    const authHeader = request.headers.get("authorization");
    if (!user && authHeader?.startsWith("Bearer ")) {
      user = await verifyToken(authHeader.slice(7));
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, bio } = body;

    // Build update query dynamically
    if (name !== undefined || phone !== undefined || bio !== undefined) {
      await sql`
        UPDATE profiles
        SET 
          name = COALESCE(${name}, name),
          phone = COALESCE(${phone}, phone),
          bio = COALESCE(${bio}, bio),
          updated_at = NOW()
        WHERE id = (SELECT COALESCE(parent_profile_id, id) FROM profiles WHERE id = ${user.id})
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
