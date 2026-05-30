"use client";

import { motion } from "framer-motion";
import { Unlock, Clock, ArrowLeftRight, Globe, TrendingUp, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Unlock,
    title: "KYC Simplificado",
    description: "Verificação rápida e descomplicada. Aprovação em até 24 horas para você começar a operar.",
  },
  {
    icon: Clock,
    title: "PIX Instantâneo",
    description: "Transações processadas em menos de 1 segundo, 24 horas por dia, 7 dias por semana.",
  },
  {
    icon: ArrowLeftRight,
    title: "Múltiplas Chaves",
    description: "Cadastre várias chaves PIX: CPF, CNPJ, email, telefone ou chave aleatória.",
  },
  {
    icon: Globe,
    title: "API REST Global",
    description: "Integração simples via API REST com documentação completa e SDKs prontos.",
  },
  {
    icon: TrendingUp,
    title: "Crescimento Escalável",
    description: "Infraestrutura que cresce junto com seu negócio, sem limites de volume.",
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte 24/7",
    description: "Equipe técnica disponível a qualquer momento para ajudar sua operação.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Tudo que você precisa para receber pagamentos online
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Infraestrutura completa, segura e pronta para escalar o seu negócio.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
