const { neon } = require("@neondatabase/serverless");

async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL nao configurado");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("Criando tabela blacklist...");
  
  await sql`
    CREATE TABLE IF NOT EXISTS blacklist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(20) NOT NULL CHECK (type IN ('cpf', 'email', 'ip', 'device', 'phone')),
      value VARCHAR(255) NOT NULL,
      reason VARCHAR(500) NOT NULL,
      notes TEXT,
      blocked_by UUID,
      user_id UUID,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(type, value)
    )
  `;

  console.log("Criando tabela blacklist_hits...");

  await sql`
    CREATE TABLE IF NOT EXISTS blacklist_hits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      blacklist_id UUID NOT NULL REFERENCES blacklist(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      path VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  console.log("Criando indices...");

  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_active ON blacklist(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON blacklist(expires_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_blacklist_hits_blacklist_id ON blacklist_hits(blacklist_id)`;

  console.log("Tabelas criadas com sucesso!");
}

setup().catch(console.error);
