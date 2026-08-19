import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { logSecurityEvent } from "@/lib/discord-webhook";

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

/**
 * Registra um ataque no banco de dados
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

  } catch (error) {
    console.error("[Attack Logger] Erro ao registrar ataque:", error);
  }

  // Aviso de VULNERABILIDADE no Discord (canal de seguranca) — marca cargos em high/critical
  try {
    logSecurityEvent({
      title: `Tentativa de ataque detectada: ${data.attackType}`,
      action: String(data.attackType),
      severity: (severityValue as "low" | "medium" | "high" | "critical") || "high",
      description: blocked ? "Requisicao bloqueada pelo sistema de defesa." : "Requisicao suspeita detectada.",
      userId: data.userId || null,
      userEmail: data.userEmail || null,
      ip: data.ipAddress,
      fields: [
        ...(data.endpoint ? [{ name: "Endpoint", value: `\`${data.endpoint}\``, inline: true }] : []),
        ...(data.payload ? [{ name: "Payload", value: `\`\`\`${data.payload.substring(0, 300)}\`\`\``, inline: false }] : []),
        { name: "Bloqueado", value: blocked ? "Sim" : "Nao", inline: true },
      ],
    });
  } catch (error) {
    console.error("[Attack Logger] Erro ao enviar alerta Discord:", error);
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
