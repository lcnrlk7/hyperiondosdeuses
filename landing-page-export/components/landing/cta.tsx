"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, FileCheck, Clock, HeadphonesIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[128px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Pronto para revolucionar seus{" "}
            <span className="text-primary text-glow">pagamentos?</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Crie sua conta gratuitamente e comece a receber pagamentos PIX hoje mesmo. 
            Integração simples, suporte dedicado e as melhores taxas do mercado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 glow-primary shimmer group"
              >
                Criar Conta Grátis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-border hover:bg-card hover:border-primary/50"
              >
                Explorar API
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-12 border-t border-border">
            {[
              { label: "SSL Seguro", icon: ShieldCheck },
              { label: "LGPD Compliant", icon: FileCheck },
              { label: "99.9% Uptime", icon: Clock },
              { label: "Suporte 24/7", icon: HeadphonesIcon },
            ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-muted-foreground text-sm"
                >
                  <badge.icon className="w-4 h-4 opacity-70" />
                  {badge.label}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
