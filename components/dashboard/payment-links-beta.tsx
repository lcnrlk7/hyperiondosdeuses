"use client";

import { Link2, Lock, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaymentLinksBeta() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Links de Pagamento</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">
              <Sparkles className="w-3 h-3" />
              Beta
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Crie links de cobrança e compartilhe com seus clientes.
          </p>
        </div>
        <Button
          disabled
          className="opacity-60 cursor-not-allowed"
          title="Disponível em breve"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo link
        </Button>
      </div>

      {/* Aviso de recurso em breve */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Preview embacado (nao funcional) */}
        <div className="pointer-events-none select-none opacity-40 blur-[2px] p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Plano Mensal", value: "R$ 49,90" },
              { name: "Consultoria Avulsa", value: "R$ 250,00" },
              { name: "Kit Completo", value: "R$ 890,00" },
            ].map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-border bg-secondary/50 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  hyperionpay.com.br/l/xxxxxx
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay central */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Em breve
            </h2>
            <p className="text-sm text-muted-foreground">
              Os Links de Pagamento estão em fase{" "}
              <span className="font-semibold text-warning">beta</span> e serão
              liberados em breve. Em breve você poderá criar links reutilizáveis,
              definir valores e acompanhar as conversões por aqui.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
