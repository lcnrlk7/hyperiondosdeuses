import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Primeiro tenta pegar do header Authorization, depois do cookie
    let user = null;
    
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      user = await verifyToken(token);
    }
    
    // Se não encontrou no header, tenta pelo cookie
    if (!user) {
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT id, name, email, phone, cpf_cnpj as cpf, kyc_status, created_at, route_type, api_key, avatar_url, bio, liveness_status, liveness_verified_at
      FROM profiles
      WHERE id = ${user.id}
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
    // Primeiro tenta pegar do header Authorization, depois do cookie
    let user = null;
    
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      user = await verifyToken(token);
    }
    
    // Se não encontrou no header, tenta pelo cookie
    if (!user) {
      user = await getCurrentUser();
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
        WHERE id = ${user.id}
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
