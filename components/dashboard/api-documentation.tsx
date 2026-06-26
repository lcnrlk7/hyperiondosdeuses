"use client";

import { useState } from "react";
import { ChevronDown, Copy, Check, Download, Terminal } from "lucide-react";

const BASE_URL = "https://api.hyperionpay.com.br";

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  params: EndpointParam[];
  requestExample?: string;
  responseExample: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "create-pix",
    method: "POST",
    path: "/api/v1/integration/pix",
    title: "Cria uma cobranca PIX",
    description:
      "Gera uma cobranca PIX com QR Code e codigo copia e cola. O valor (amount) e enviado em reais (R$).",
    params: [
      { name: "amount", type: "number", required: true, description: "Valor da cobranca em reais. Minimo R$ 1,00 e maximo R$ 50.000,00." },
      { name: "external_id", type: "string", required: false, description: "Seu identificador unico para a transacao. Util para conciliacao." },
      { name: "description", type: "string", required: false, description: "Descricao que aparece na cobranca." },
      { name: "payer.name", type: "string", required: false, description: "Nome do pagador." },
      { name: "payer.document", type: "string", required: false, description: "CPF/CNPJ do pagador (somente numeros)." },
      { name: "payer.email", type: "string", required: false, description: "E-mail do pagador." },
    ],
    requestExample: `curl -X POST ${BASE_URL}/api/v1/integration/pix \\
  -H "Authorization: Basic <base64(client_id:client_secret)>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 49.90,
    "external_id": "pedido_123",
    "description": "Assinatura mensal",
    "payer": { "name": "Maria Silva", "document": "12345678900" }
  }'`,
    responseExample: `{
  "success": true,
  "data": {
    "transaction_id": "a1b2c3d4-...",
    "external_id": "pedido_123",
    "amount": 49.90,
    "fee": 2.50,
    "net_amount": 47.40,
    "status": "pending",
    "pix": {
      "qr_code": "00020126...BR.GOV.BCB.PIX...",
      "qr_code_base64": "data:image/png;base64,iVBOR...",
      "copy_paste": "00020126...BR.GOV.BCB.PIX..."
    },
    "expires_at": "2025-01-01T12:30:00.000Z",
    "created_at": "2025-01-01T12:00:00.000Z"
  }
}`,
  },
  {
    id: "get-pix",
    method: "GET",
    path: "/api/v1/integration/pix",
    title: "Consulta uma cobranca",
    description:
      "Consulta o status de uma cobranca PIX. Informe transaction_id OU external_id como parametro de query.",
    params: [
      { name: "transaction_id", type: "query", required: false, description: "ID da transacao retornado na criacao." },
      { name: "external_id", type: "query", required: false, description: "Seu identificador enviado na criacao." },
    ],
    requestExample: `curl "${BASE_URL}/api/v1/integration/pix?external_id=pedido_123" \\
  -H "Authorization: Basic <base64(client_id:client_secret)>"`,
    responseExample: `{
  "success": true,
  "data": {
    "transaction_id": "a1b2c3d4-...",
    "external_id": "pedido_123",
    "amount": 49.90,
    "fee": 2.50,
    "net_amount": 47.40,
    "status": "completed",
    "description": "Assinatura mensal",
    "payer": { "name": "Maria Silva", "document": "12345678900" },
    "created_at": "2025-01-01T12:00:00.000Z",
    "updated_at": "2025-01-01T12:05:00.000Z"
  }
}`,
  },
  {
    id: "list-transactions",
    method: "GET",
    path: "/api/v1/integration/transactions",
    title: "Lista cobrancas",
    description:
      "Lista as transacoes da conta com paginacao e filtros opcionais por status e periodo.",
    params: [
      { name: "status", type: "query", required: false, description: "Filtra por status (pending, completed, etc)." },
      { name: "limit", type: "query", required: false, description: "Quantidade por pagina (max 100, padrao 50)." },
      { name: "offset", type: "query", required: false, description: "Deslocamento para paginacao (padrao 0)." },
      { name: "start_date", type: "query", required: false, description: "Data inicial (ISO 8601)." },
      { name: "end_date", type: "query", required: false, description: "Data final (ISO 8601)." },
    ],
    requestExample: `curl "${BASE_URL}/api/v1/integration/transactions?status=completed&limit=20" \\
  -H "Authorization: Basic <base64(client_id:client_secret)>"`,
    responseExample: `{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_id": "a1b2c3d4-...",
        "external_id": "pedido_123",
        "amount": 49.90,
        "fee": 2.50,
        "net_amount": 47.40,
        "status": "completed",
        "description": "Assinatura mensal",
        "payer": { "name": "Maria Silva", "document": "12345678900" },
        "created_at": "2025-01-01T12:00:00.000Z",
        "updated_at": "2025-01-01T12:05:00.000Z"
      }
    ],
    "pagination": { "total": 134, "limit": 20, "offset": 0, "has_more": true }
  }
}`,
  },
  {
    id: "create-withdrawal",
    method: "POST",
    path: "/api/v1/integration/withdrawal",
    title: "Realiza um saque via PIX",
    description:
      "Cria um saque PIX debitado do seu saldo disponivel (valor + taxa). Saques de ate R$ 500,00 sao processados automaticamente.",
    params: [
      { name: "amount", type: "number", required: true, description: "Valor do saque em reais. Minimo R$ 10,00." },
      { name: "pix_key", type: "string", required: true, description: "Chave PIX de destino." },
      { name: "pix_key_type", type: "string", required: true, description: "Tipo da chave: cpf, cnpj, email, phone ou random." },
      { name: "external_id", type: "string", required: false, description: "Seu identificador unico para o saque." },
      { name: "description", type: "string", required: false, description: "Descricao do saque." },
    ],
    requestExample: `curl -X POST ${BASE_URL}/api/v1/integration/withdrawal \\
  -H "Authorization: Basic <base64(client_id:client_secret)>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 100.00,
    "pix_key": "email@exemplo.com",
    "pix_key_type": "email",
    "external_id": "saque_123"
  }'`,
    responseExample: `{
  "success": true,
  "data": {
    "withdrawal_id": "wd_a1b2c3d4-...",
    "external_id": "saque_123",
    "amount": 100.00,
    "fee": 2.00,
    "net_amount": 100.00,
    "pix_key": "email@exemplo.com",
    "pix_key_type": "email",
    "status": "processing",
    "created_at": "2025-01-01T12:00:00.000Z"
  }
}`,
  },
  {
    id: "get-withdrawal",
    method: "GET",
    path: "/api/v1/integration/withdrawal",
    title: "Consulta um saque",
    description:
      "Consulta o status de um saque. Informe withdrawal_id OU external_id como parametro de query.",
    params: [
      { name: "withdrawal_id", type: "query", required: false, description: "ID do saque retornado na criacao." },
      { name: "external_id", type: "query", required: false, description: "Seu identificador enviado na criacao." },
    ],
    requestExample: `curl "${BASE_URL}/api/v1/integration/withdrawal?external_id=saque_123" \\
  -H "Authorization: Basic <base64(client_id:client_secret)>"`,
    responseExample: `{
  "success": true,
  "data": {
    "withdrawal_id": "wd_a1b2c3d4-...",
    "external_id": "saque_123",
    "status": "completed",
    "amount": 100.00,
    "fee": 2.00,
    "net_amount": 100.00,
    "pix_key": "email@exemplo.com",
    "pix_key_type": "email",
    "created_at": "2025-01-01T12:00:00.000Z",
    "completed_at": "2025-01-01T12:01:00.000Z",
    "failed_reason": null
  }
}`,
  },
  {
    id: "get-balance",
    method: "GET",
    path: "/api/v1/integration/balance",
    title: "Consulta o saldo da conta",
    description:
      "Retorna o saldo disponivel, o status do KYC e estatisticas das transacoes recebidas.",
    params: [],
    requestExample: `curl "${BASE_URL}/api/v1/integration/balance" \\
  -H "Authorization: Basic <base64(client_id:client_secret)>"`,
    responseExample: `{
  "success": true,
  "data": {
    "balance": 1530.75,
    "kyc_status": "approved",
    "statistics": {
      "completed_transactions": 128,
      "pending_transactions": 4,
      "total_received": 8450.00,
      "total_fees": 320.50
    }
  }
}`,
  },
];

const ERROR_CODES: { code: string; description: string }[] = [
  { code: "400", description: "Dados invalidos na requisicao" },
  { code: "401", description: "Credenciais invalidas ou ausentes" },
  { code: "403", description: "KYC pendente, conta ou integracao desativada" },
  { code: "404", description: "Recurso nao encontrado" },
  { code: "500", description: "Erro interno do servidor" },
];

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative">
      {label && (
        <span className="absolute top-2 left-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
        title="Copiar"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className={`bg-background border border-border rounded-lg p-4 ${label ? "pt-7" : ""} overflow-x-auto`}>
        <code className="text-xs font-mono text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function methodBadgeClasses(method: string) {
  switch (method) {
    case "POST":
      return "bg-emerald-500/15 text-emerald-400";
    case "GET":
      return "bg-blue-500/15 text-blue-400";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function buildAiTxt(): string {
  const lines: string[] = [];
  lines.push("HYPERION PAY - DOCUMENTACAO DA API");
  lines.push("===================================");
  lines.push("");
  lines.push(`Base URL: ${BASE_URL}`);
  lines.push("");
  lines.push("AUTENTICACAO");
  lines.push("------------");
  lines.push("Todas as requisicoes exigem suas credenciais de integracao (Client ID + Client Secret).");
  lines.push("Voce pode autenticar de duas formas:");
  lines.push("1. Basic Auth: header 'Authorization: Basic <base64(client_id:client_secret)>'");
  lines.push("2. Headers separados: 'x-client-id: <client_id>' e 'x-client-secret: <client_secret>'");
  lines.push("Gere suas credenciais em Dashboard > Integracao.");
  lines.push("Requisito: KYC aprovado e conta/integracao ativas.");
  lines.push("");
  lines.push("OBSERVACOES");
  lines.push("-----------");
  lines.push("- Os valores (amount) sao sempre em reais (R$), aceitando casas decimais.");
  lines.push("- Cobranca PIX: minimo R$ 1,00, maximo R$ 50.000,00.");
  lines.push("- Saque PIX: minimo R$ 10,00. Saques <= R$ 500,00 sao processados automaticamente.");
  lines.push("- Respostas seguem o formato { success: boolean, data?: object, error?: string, code?: string }.");
  lines.push("");
  lines.push("ENDPOINTS");
  lines.push("=========");
  for (const ep of ENDPOINTS) {
    lines.push("");
    lines.push(`${ep.method} ${ep.path}`);
    lines.push("-".repeat(`${ep.method} ${ep.path}`.length));
    lines.push(ep.title);
    lines.push(ep.description);
    lines.push("");
    if (ep.params.length > 0) {
      lines.push("Parametros:");
      for (const p of ep.params) {
        lines.push(`  - ${p.name} (${p.type})${p.required ? " [obrigatorio]" : " [opcional]"}: ${p.description}`);
      }
      lines.push("");
    }
    if (ep.requestExample) {
      lines.push("Exemplo de requisicao:");
      lines.push(ep.requestExample);
      lines.push("");
    }
    lines.push("Exemplo de resposta:");
    lines.push(ep.responseExample);
    lines.push("");
  }
  lines.push("CODIGOS DE ERRO");
  lines.push("===============");
  for (const e of ERROR_CODES) {
    lines.push(`${e.code} - ${e.description}`);
  }
  lines.push("");
  lines.push("Gerado automaticamente pela plataforma Hyperion Pay.");
  return lines.join("\n");
}

export function ApiDocumentation() {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleDownload = () => {
    const content = buildAiTxt();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hyperionpay-api-docs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickStart = `curl -X POST ${BASE_URL}/api/v1/integration/pix \\
  -H "Authorization: Basic <base64(client_id:client_secret)>" \\
  -H "Content-Type: application/json" \\
  -d '{ "amount": 14.90 }'`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Integracoes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas credenciais e configure sua comunicacao via API.
        </p>
      </div>

      {/* Inicio rapido */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Inicio rapido</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Crie sua primeira cobranca PIX. Autentique enviando suas credenciais no header{" "}
          <code className="text-foreground font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">Authorization</code>.
        </p>
        <CodeBlock code={quickStart} />
        <p className="text-xs text-muted-foreground mt-2">
          O valor <code className="text-foreground font-mono">amount</code> e enviado em reais (R$).
        </p>
      </div>

      {/* Referencia da API */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="text-base font-semibold text-foreground">Referencia da API</h3>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/70 transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Baixar .txt para IA</span>
            <span className="sm:hidden">.txt IA</span>
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Clique em um endpoint para ver parametros, exemplos de codigo e a resposta.
        </p>

        <div className="space-y-2">
          {ENDPOINTS.map((ep) => {
            const isOpen = openId === ep.id;
            return (
              <div key={ep.id} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : ep.id)}
                  className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/40 transition-colors text-left"
                >
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${methodBadgeClasses(ep.method)}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-foreground truncate">{ep.path}</code>
                  <span className="ml-auto text-xs text-muted-foreground hidden sm:block truncate max-w-[40%]">
                    {ep.title}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border p-4 space-y-4 bg-background/40">
                    <p className="text-sm text-muted-foreground">{ep.description}</p>

                    {ep.params.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Parametros
                        </h4>
                        <div className="space-y-2">
                          {ep.params.map((p) => (
                            <div key={p.name} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
                              <div className="flex items-center gap-2 sm:w-48 flex-shrink-0">
                                <code className="font-mono text-foreground">{p.name}</code>
                                <span className="text-[10px] text-muted-foreground">{p.type}</span>
                                {p.required ? (
                                  <span className="text-[10px] text-red-400">obrigatorio</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">opcional</span>
                                )}
                              </div>
                              <span className="text-muted-foreground text-xs sm:text-sm">{p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ep.requestExample && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Exemplo de requisicao
                        </h4>
                        <CodeBlock code={ep.requestExample} />
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Resposta
                      </h4>
                      <CodeBlock code={ep.responseExample} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Codigos de erro */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground mb-2">Codigos de erro</h4>
          <div className="space-y-2">
            {ERROR_CODES.map((e) => (
              <div key={e.code} className="flex justify-between p-2.5 bg-secondary/50 rounded-lg text-xs">
                <code className="text-red-400 font-mono">{e.code}</code>
                <span className="text-muted-foreground">{e.description}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
          Autentique com Basic Auth ou os headers{" "}
          <code className="text-foreground font-mono">x-client-id</code> /{" "}
          <code className="text-foreground font-mono">x-client-secret</code>. Base URL:{" "}
          <code className="text-foreground font-mono">{BASE_URL}</code>
        </p>
      </div>
    </div>
  );
}
