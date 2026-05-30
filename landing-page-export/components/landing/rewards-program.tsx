"use client";

import { motion } from "framer-motion";
import { Trophy, Star, ArrowRight, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const rewardLevels = [
  {
    amount: "10MIL",
    label: "10 Mil em Saques",
    color: "from-zinc-400 to-zinc-300",
    textColor: "text-zinc-300",
    borderColor: "border-zinc-500/30",
    bgColor: "bg-zinc-900/50",
  },
  {
    amount: "100MIL",
    label: "100 Mil em Saques",
    color: "from-amber-500 to-yellow-400",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-950/30",
  },
  {
    amount: "500MIL",
    label: "500 Mil em Saques",
    color: "from-emerald-500 to-green-400",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-950/30",
  },
  {
    amount: "1MILHAO",
    label: "1 Milhao em Saques",
    color: "from-primary to-indigo-400",
    textColor: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/10",
  },
];

const benefits = [
  { icon: TrendingUp, text: "Reconhecimento por metas de vendas" },
  { icon: Trophy, text: "Premiacoes especiais para grandes resultados" },
  { icon: Star, text: "Beneficios exclusivos para players escalados" },
];

export function RewardsProgram() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Featured Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Main Card */}
            <div className="relative max-w-sm mx-auto lg:mx-0">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/20 via-primary/10 to-yellow-500/20 rounded-3xl blur-2xl" />
              
              <div className="relative bg-gradient-to-b from-zinc-900 to-black border border-yellow-500/30 rounded-2xl p-8 text-center">
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-yellow-500 to-primary text-black text-xs font-bold rounded-full">
                    CONQUISTA MAXIMA
                  </span>
                </div>
                
                {/* Amount */}
                <h3 className="text-5xl font-black bg-gradient-to-b from-yellow-400 to-primary bg-clip-text text-transparent mb-6">
                  1 MILHAO
                </h3>
                
                {/* Plate Image */}
                <div className="relative w-56 h-56 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-primary/30 rounded-2xl blur-2xl" />
                  <Image
                    src="/images/rewards/placa-1m.png"
                    alt="Placa 1 Milhao Faturados Hyperion Pay"
                    width={224}
                    height={224}
                    className="relative rounded-xl object-contain border border-yellow-500/30 shadow-2xl"
                  />
                </div>
                
                {/* Label */}
                <p className="text-sm text-yellow-400 font-semibold mb-4">Hyperion Pay</p>
                
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Um marco extraordinario. Parabens por alcancar 1 milhao em faturamento! Seu esforco, dedicacao e visao te trouxeram ate aqui. Que essa conquista seja apenas o comeco de um legado ainda maior.
                </p>
              </div>
              
              {/* Label below card */}
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">1 MILHAO FATURADOS - <span className="text-yellow-400">Hyperion Pay</span></p>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Quanto mais voce escala, mais voce ganha.
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground text-lg mb-6">
              Na Hyperion Pay, o crescimento dos nossos produtores tambem e celebrado.
            </p>
            
            <p className="text-muted-foreground mb-8">
              Criamos um <span className="text-white">programa exclusivo de premiacoes</span> para reconhecer quem esta alcancando novos niveis de faturamento dentro da plataforma.
            </p>
            
            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <benefit.icon className="w-5 h-5 text-primary" />
                  <span className="text-primary">{benefit.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/auth/register"
                className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                Crie sua conta tambem!
              </Link>
              <Link 
                href="https://wa.me/5534999353187?text=Ola! Gostaria de saber mais sobre a Hyperion Pay"
                target="_blank"
                className="px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Fale com suporte
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
