import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not configured")
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1500693292646531133/gVI0W3szJ-gOZ7wUStf7UdRHrBfWCyRAY3IZluC2QcvT6ezuMPFOhyZeH9N2BQkBSI2Q";

export type AttackType = 
  | "XSS_ATTEMPT"
  | "SQL_INJECTION"
  | "COMMAND_INJECTION"
  | "PATH_TRAVERSAL"
  | "LDAP_INJECTION"
  | "XML_INJECTION"
  | "HEADER_INJECTION"
  | "NOSQL_INJECTION"
  | "TEMPLATE_INJECTION"
  | "LOG_INJECTION"
  | "BRUTE_FORCE"
  | "RATE_LIMIT"
  | "INVALID_INPUT"
  | "UNAUTHORIZED_ACCESS"
  | "SUSPICIOUS_ACTIVITY";

export type Severity = "low" | "medium" | "high" | "critical";

interface AttackLogData {
  attackType: AttackType | string;
  ipAddress: string;
  userId?: string;
  userEmail?: string;
  payload?: string;
  userAgent?: string;
  endpoint?: string;
  severity?: Severity | string;
  blocked?: boolean;
}

// Cores do embed por severidade
const SEVERITY_COLORS: Record<string, number> = {
  low: 0x3498db,      // Azul
  medium: 0xf39c12,   // Amarelo
  high: 0xe74c3c,     // Vermelho
  critical: 0x8b0000, // Vermelho escuro
};

// Emojis por tipo de ataque
const ATTACK_EMOJIS: Record<string, string> = {
  XSS_ATTEMPT: "🔴",
  SQL_INJECTION: "💉",
  COMMAND_INJECTION: "💀",
  PATH_TRAVERSAL: "📂",
  LDAP_INJECTION: "🔓",
  XML_INJECTION: "📄",
  HEADER_INJECTION: "📨",
  NOSQL_INJECTION: "🗄️",
  TEMPLATE_INJECTION: "📝",
  LOG_INJECTION: "📋",
  BRUTE_FORCE: "🔨",
  RATE_LIMIT: "⚡",
  INVALID_INPUT: "⚠️",
  UNAUTHORIZED_ACCESS: "🚫",
  SUSPICIOUS_ACTIVITY: "👁️",
};

// Descricoes amigaveis
const ATTACK_DESCRIPTIONS: Record<string, string> = {
  XSS_ATTEMPT: "Tentativa de Cross-Site Scripting (XSS)",
  SQL_INJECTION: "Tentativa de SQL Injection",
  COMMAND_INJECTION: "Tentativa de Command Injection",
  PATH_TRAVERSAL: "Tentativa de Path Traversal",
  LDAP_INJECTION: "Tentativa de LDAP Injection",
  XML_INJECTION: "Tentativa de XML/XXE Injection",
  HEADER_INJECTION: "Tentativa de Header Injection",
  NOSQL_INJECTION: "Tentativa de NoSQL Injection",
  TEMPLATE_INJECTION: "Tentativa de Template Injection (SSTI)",
  LOG_INJECTION: "Tentativa de Log Injection",
  BRUTE_FORCE: "Ataque de Forca Bruta",
  RATE_LIMIT: "Limite de Requisicoes Excedido",
  INVALID_INPUT: "Input Malicioso Detectado",
  UNAUTHORIZED_ACCESS: "Acesso Nao Autorizado",
  SUSPICIOUS_ACTIVITY: "Atividade Suspeita",
};

/**
 * Registra um ataque no banco de dados e envia webhook para Discord
 */
export async function logAttack(data: AttackLogData): Promise<void> {
  const severityValue = (data.severity || "medium") as Severity;
  const blocked = data.blocked ?? true;
  
  try {
    // Salvar no banco de dados
    const sql = getSql();
    await sql`
      INSERT INTO attack_logs (
        attack_type, ip_address, user_id, user_email, 
        payload, user_agent, endpoint, severity, blocked
      ) VALUES (
        ${data.attackType},
        ${data.ipAddress},
        ${data.userId || null},
        ${data.userEmail || null},
        ${data.payload?.substring(0, 1000) || null},
        ${data.userAgent?.substring(0, 500) || null},
        ${data.endpoint || null},
        ${severityValue},
        ${blocked}
      )
    `;
    
    // Enviar webhook para Discord
    await sendDiscordAlert(data, severityValue, blocked);
    
  } catch (error) {
    console.error("[Attack Logger] Erro ao registrar ataque:", error);
  }
}

/**
 * Envia alerta para Discord via webhook
 */
async function sendDiscordAlert(
  data: AttackLogData, 
  severity: Severity,
  blocked: boolean
): Promise<void> {
  try {
    const emoji = ATTACK_EMOJIS[data.attackType] || "⚠️";
    const description = ATTACK_DESCRIPTIONS[data.attackType] || data.attackType;
    const color = SEVERITY_COLORS[severity];
    
    const embed = {
      title: `${emoji} ALERTA DE SEGURANCA`,
      description: `**${description}**`,
      color: color,
      fields: [
        {
          name: "🌐 IP do Atacante",
          value: `\`${data.ipAddress || "Desconhecido"}\``,
          inline: true,
        },
        {
          name: "⚡ Severidade",
          value: severity.toUpperCase(),
          inline: true,
        },
        {
          name: "🛡️ Status",
          value: blocked ? "✅ BLOQUEADO" : "⚠️ DETECTADO",
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Hyperion Pay Security System",
      },
    };
    
    // Adicionar campos opcionais
    if (data.userEmail) {
      embed.fields.push({
        name: "📧 Email",
        value: `\`${data.userEmail}\``,
        inline: true,
      });
    }
    
    if (data.endpoint) {
      embed.fields.push({
        name: "🔗 Endpoint",
        value: `\`${data.endpoint}\``,
        inline: true,
      });
    }
    
    if (data.payload) {
      // Limitar tamanho e escapar caracteres perigosos
      const safePayload = data.payload
        .substring(0, 200)
        .replace(/`/g, "'")
        .replace(/\n/g, " ");
      embed.fields.push({
        name: "📦 Payload Malicioso",
        value: `\`\`\`${safePayload}\`\`\``,
        inline: false,
      });
    }
    
    // Mensagem de destaque para ataques criticos
    let content = "";
    if (severity === "critical") {
      content = "🚨 **ATAQUE CRITICO DETECTADO** 🚨";
    } else if (severity === "high") {
      content = "⚠️ **Ataque de Alta Severidade**";
    }
    
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        embeds: [embed],
        username: "Hyperion Pay Security",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/6195/6195699.png",
      }),
    });
    
  } catch (error) {
    console.error("[Discord Webhook] Erro ao enviar alerta:", error);
  }
}

/**
 * Busca logs de ataques recentes
 */
export async function getAttackLogs(limit = 100, offset = 0) {
  const sql = getSql();
  const logs = await sql`
    SELECT 
      al.*,
      p.name as user_name
    FROM attack_logs al
    LEFT JOIN profiles p ON p.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  return logs;
}

/**
 * Busca estatisticas de ataques
 */
export async function getAttackStats() {
  const sql = getSql();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE created_at >= ${today.toISOString()}) as today,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE severity = 'high') as high,
      COUNT(*) FILTER (WHERE blocked = true) as blocked,
      COUNT(DISTINCT ip_address) as unique_ips
    FROM attack_logs
  `;
  
  const byType = await sql`
    SELECT attack_type, COUNT(*) as count
    FROM attack_logs
    GROUP BY attack_type
    ORDER BY count DESC
  `;
  
  return {
    ...stats[0],
    byType,
  };
}

/**
 * Testa o webhook do Discord
 */
export async function testDiscordWebhook(): Promise<boolean> {
  try {
    await sendDiscordAlert(
      {
        attackType: "SUSPICIOUS_ACTIVITY",
        ipAddress: "127.0.0.1",
        payload: "Teste de webhook - Sistema de seguranca ativo!",
        endpoint: "/api/test",
        severity: "low",
      },
      "low",
      false
    );
    return true;
  } catch (error) {
    console.error("[Discord Webhook] Erro no teste:", error);
    return false;
  }
}
