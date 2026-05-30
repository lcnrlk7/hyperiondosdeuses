"use client";

import { motion } from "framer-motion";
import { Check, Rocket, Lock, Headphones, Code2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Rocket, text: "Ativação instantânea", color: "from-indigo-500 to-violet-500" },
  { icon: Lock, text: "Checkout 100% seguro", color: "from-emerald-500 to-green-500" },
  { icon: Headphones, text: "Suporte 24 horas", color: "from-blue-500 to-cyan-500" },
  { icon: Code2, text: "Integração simplificada", color: "from-purple-500 to-pink-500" },
];

export function Taxas() {
  return (
    <section id="taxas" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Card */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border border-border shadow-2xl">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
            
            <div className="p-8 md:p-12 lg:p-16">
              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                  PIX a partir de{" "}
                  <span className="text-primary">R$ 0,50</span>
                  <br className="hidden sm:block" />
                  <span className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground font-normal">
                    {" "}por transação
                  </span>
                </h2>
                
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Sem taxas de adesão, sem mensalidades e sem surpresas. 
                  Você paga apenas uma pequena taxa por transação aprovada.
                  A solução completa para impulsionar seus pagamentos digitais.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 cursor-pointer transition-colors duration-300"
                  >
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <benefit.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="text-sm font-medium text-foreground text-center group-hover:text-primary transition-colors duration-300">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Features List */}
              <div className="bg-background/30 rounded-2xl p-6 md:p-8 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "API REST completa e documentada",
                    "Webhooks em tempo real",
                    "Dashboard completo e intuitivo",
                    "Relatórios detalhados",
                    "Múltiplas chaves PIX",
                    "Saque rápido para sua conta",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="h-14 px-10 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
                  >
                    Criar Conta Gratuita
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground mt-4">
                  Cadastro em menos de 2 minutos. Sem burocracia.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
