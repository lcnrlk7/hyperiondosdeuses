"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

/* ---------- Lightweight syntax highlighter ---------- */

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+\.?\d*\b)|\b(const|let|var|await|async|import|from|export|new|return|def|print|function|require|if|else|for|true|false|null|None|True|False)\b/g;

function Highlighted({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="table-row">
          <span className="table-cell select-none pr-4 text-right text-white/25 tabular-nums">
            {i + 1}
          </span>
          <span className="table-cell whitespace-pre-wrap break-words">
            <LineTokens line={line} />
          </span>
        </div>
      ))}
    </>
  );
}

function LineTokens({ line }: { line: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE);
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) nodes.push(<span key={key++}>{line.slice(last, m.index)}</span>);
    const [full, comment, str, num, kw] = m;
    if (comment) nodes.push(<span key={key++} className="text-slate-500 italic">{full}</span>);
    else if (str) nodes.push(<span key={key++} className="text-emerald-300">{full}</span>);
    else if (num) nodes.push(<span key={key++} className="text-amber-300">{full}</span>);
    else if (kw) nodes.push(<span key={key++} className="text-pink-400">{full}</span>);
    else nodes.push(<span key={key++}>{full}</span>);
    last = m.index + full.length;
  }
  if (last < line.length) nodes.push(<span key={key++}>{line.slice(last)}</span>);
  return <span className="text-slate-200">{nodes}</span>;
}

/* ---------- Snippets ---------- */

const SNIPPETS: Record<string, { label: string; code: string }> = {
  node: {
    label: "Node.js",
    code: `import { HyperionPay } from "hyperionpay";

const hp = new HyperionPay("sk_live_5f8a...c3d1");

// Cria uma cobrança PIX de R$ 49,90
const charge = await hp.charges.create({
  amount: 4990,
  payment_method: "pix",
  expires_in: 3600,
  customer: {
    name: "João Silva",
    document: "123.456.789-00",
  },
});

console.log(charge.pix.copy_paste);`,
  },
  curl: {
    label: "cURL",
    code: `curl https://api.hyperionpay.com.br/v1/charges \\
  -H "Authorization: Bearer sk_live_5f8a...c3d1" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 4990,
    "payment_method": "pix",
    "expires_in": 3600,
    "customer": {
      "name": "João Silva",
      "document": "123.456.789-00"
    }
  }'`,
  },
  python: {
    label: "Python",
    code: `from hyperionpay import HyperionPay

hp = HyperionPay("sk_live_5f8a...c3d1")

# Cria uma cobrança PIX de R$ 49,90
charge = hp.charges.create(
    amount=4990,
    payment_method="pix",
    expires_in=3600,
    customer={
        "name": "João Silva",
        "document": "123.456.789-00",
    },
)

print(charge.pix.copy_paste)`,
  },
};

const RESPONSE = `{
  "id": "ch_8f2a91d4e7",
  "status": "pending",
  "amount": 4990,
  "payment_method": "pix",
  "pix": {
    "qr_code_url": "https://cdn.hyperionpay.com.br/qr/8f2a91.png",
    "copy_paste": "00020126580014br.gov.bcb.pix0136...5204000053039865802BR",
    "expires_at": "2026-08-16T05:20:00Z"
  },
  "created_at": "2026-08-16T04:20:00Z"
}`;

const WEBHOOK = `{
  "event": "charge.paid",
  "data": {
    "id": "ch_8f2a91d4e7",
    "status": "paid",
    "amount": 4990,
    "net_amount": 4865,
    "paid_at": "2026-08-16T04:20:37Z"
  }
}`;

/* ---------- Component ---------- */

export function DocsShowcase() {
  const [lang, setLang] = useState<keyof typeof SNIPPETS>("node");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPETS[lang].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-10 lg:gap-14 items-start">
      {/* Left — explanation */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-pink-50 border border-pink-100 rounded-full">
          <Code2Icon />
          <span className="text-xs font-medium text-pink-700">Documentação para desenvolvedores</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 text-balance">
          Integre em minutos, não em semanas.
        </h2>
        <p className="text-base md:text-lg text-slate-600 mb-8 text-pretty leading-relaxed">
          Uma API REST limpa e previsível. Crie uma cobrança PIX com poucas linhas de
          código e receba a confirmação do pagamento por webhook assinado, em tempo real.
        </p>

        <ul className="space-y-4">
          {[
            { t: "SDKs oficiais", d: "Node.js, Python, PHP e Go prontos para produção." },
            { t: "Webhooks assinados", d: "Eventos confiáveis com assinatura HMAC e re-tentativas automáticas." },
            { t: "Ambiente de testes", d: "Chaves de sandbox para simular pagamentos sem custo." },
            { t: "Confirmação < 2s", d: "Do QR Code ao callback de pago em segundos." },
          ].map((f) => (
            <li key={f.t} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-pink-600/10">
                <Check className="h-3.5 w-3.5 text-pink-600" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{f.t}</p>
                <p className="text-sm text-slate-500">{f.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right — code */}
      <div className="space-y-5">
        {/* Request window */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1120] shadow-2xl shadow-slate-900/20">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <span className="flex items-center gap-1.5 text-xs text-white/40">
                <Terminal className="h-3.5 w-3.5" /> Criar cobrança PIX
              </span>
            </div>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-white/10 px-2 pt-2">
            {(Object.keys(SNIPPETS) as (keyof typeof SNIPPETS)[]).map((k) => (
              <button
                key={k}
                onClick={() => setLang(k)}
                className={`rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  lang === k
                    ? "bg-white/[0.06] text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {SNIPPETS[k].label}
              </button>
            ))}
          </div>

          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono">
            <code className="table w-full">
              <Highlighted code={SNIPPETS[lang].code} />
            </code>
          </pre>
        </div>

        {/* Response + webhook */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-pink-500" />
              <span className="text-xs font-medium text-slate-500">Resposta 200 OK</span>
            </div>
            <pre className="overflow-x-auto bg-[#0b1120] p-4 text-[11.5px] leading-relaxed font-mono">
              <code className="table w-full">
                <Highlighted code={RESPONSE} />
              </code>
            </pre>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-500">Webhook · charge.paid</span>
            </div>
            <pre className="overflow-x-auto bg-[#0b1120] p-4 text-[11.5px] leading-relaxed font-mono">
              <code className="table w-full">
                <Highlighted code={WEBHOOK} />
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function Code2Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-700">
      <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" />
    </svg>
  );
}
