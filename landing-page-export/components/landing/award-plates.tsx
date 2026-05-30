"use client";

import { motion } from "framer-motion";
import { Trophy, Award } from "lucide-react";
import Image from "next/image";

const rewards = [
  {
    amount: "20K",
    label: "Pulseira Exclusiva",
    description: "Fature R$ 20 mil",
    image: "/images/rewards/pulseira-20k.png",
    iconColor: "text-primary",
    borderColor: "border-primary/50",
    textColor: "text-primary",
    type: "pulseira",
  },
  {
    amount: "100K",
    label: "Placa 100K Faturados",
    description: "Fature R$ 100 mil",
    image: "/images/rewards/placa-100k.png",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/50",
    textColor: "text-amber-400",
    type: "placa",
  },
  {
    amount: "500K",
    label: "Placa 500K Faturados",
    description: "Fature R$ 500 mil",
    image: "/images/rewards/placa-500k.png",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/50",
    textColor: "text-emerald-400",
    type: "placa",
  },
  {
    amount: "1M",
    label: "Placa 1 Milhao Faturados",
    description: "Fature R$ 1 milhao",
    image: "/images/rewards/placa-1m.png",
    iconColor: "text-yellow-400",
    borderColor: "border-yellow-500/50",
    textColor: "text-yellow-400",
    type: "placa",
  },
];

export function AwardPlates() {
  return (
    <section className="py-24 relative overflow-hidden bg-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Premiacoes </span>
            <span className="text-primary">Hyperion Pay</span>
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Seja reconhecido pelo seu sucesso. Ganhe premiacoes exclusivas ao atingir suas metas de faturamento.
          </p>
        </motion.div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {rewards.map((reward, index) => (
            <motion.div
              key={reward.amount}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className={`relative bg-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 text-center hover:border-zinc-600 transition-all duration-300 hover:shadow-lg hover:shadow-${reward.iconColor.replace('text-', '')}/10`}>
                {/* Badge */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-900 border ${reward.borderColor}`}>
                  <span className={`text-xs font-bold ${reward.textColor}`}>
                    R$ {reward.amount}
                  </span>
                </div>
                
                {/* Reward Image */}
                <div className="relative w-full aspect-[4/3] max-w-[200px] mx-auto mt-4 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={reward.image}
                    alt={reward.label}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Icon */}
                <div className={`w-10 h-10 mx-auto mb-3 bg-zinc-900 rounded-lg flex items-center justify-center border ${reward.borderColor}`}>
                  {reward.type === "pulseira" ? (
                    <Award className={`w-5 h-5 ${reward.iconColor}`} />
                  ) : (
                    <Trophy className={`w-5 h-5 ${reward.iconColor}`} />
                  )}
                </div>
                
                {/* Label */}
                <h3 className={`text-sm font-bold ${reward.textColor} mb-1`}>
                  {reward.label}
                </h3>
                <p className="text-xs text-zinc-500">
                  {reward.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            Comece a faturar hoje e conquiste suas premiacoes exclusivas
          </p>
        </motion.div>
      </div>
    </section>
  );
}
