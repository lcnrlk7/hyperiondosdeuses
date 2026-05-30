"use client";

import { motion } from "framer-motion";
import { BadgePercent, MapPin, Banknote, QrCode } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: BadgePercent,
    title: "Taxas que fazem sentido para quem vende muito",
    description: "Na Hyperion Pay, aplicamos taxas realmente justas, sempre. A taxa varia de 0% a 1% por venda, sem taxas escondidas.",
    highlight: true,
  },
  {
    icon: MapPin,
    title: "Venda para o Brasil inteiro",
    description: "Expanda suas vendas e alcance clientes em todo o territorio nacional. Pagamentos instantaneos via PIX 24h por dia.",
  },
  {
    icon: Banknote,
    title: "Dinheiro mais rapido no seu caixa",
    description: "PIX D+0. Receba suas vendas instantaneamente na sua conta, sem esperar dias para o dinheiro cair.",
  },
  {
    icon: QrCode,
    title: "PIX instantaneo, mais conversao",
    description: "Ofereca pagamento via PIX para seus clientes. Rapido, seguro e sem complicacao - a forma preferida dos brasileiros.",
  },
];

export function WhyChoose() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Por que escolher a Hyperion Pay?
            </h2>
            
            <p className="text-muted-foreground text-lg mb-4">
              A plataforma feita para quem <span className="text-primary font-semibold">quer escalar de verdade.</span>
            </p>
            
            <p className="text-muted-foreground mb-6">
              A Hyperion Pay combina taxas competitivas, vendas internacionais e recebimento rapido para que voce fique com a maior parte do seu lucro.
            </p>
            
            <p className="text-primary font-medium mb-2">Sem burocracia. Sem limitacoes.</p>
            <p className="text-muted-foreground mb-8">Apenas estrutura para escalar.</p>
            
            <Link 
              href="/auth/register"
              className="inline-block px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Crie sua conta na Hyperion Pay
            </Link>
          </motion.div>

          {/* Right Side - Benefit Cards */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                  benefit.highlight 
                    ? "bg-gradient-to-r from-primary/20 to-indigo-600/10 border-primary/30" 
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    benefit.highlight ? "bg-primary/20" : "bg-zinc-800"
                  }`}>
                    <benefit.icon className={`w-6 h-6 ${benefit.highlight ? "text-primary" : "text-zinc-400"}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
