"use client";

import { motion } from "framer-motion";

const integrations = [
  { name: "TikTok", icon: "T" },
  { name: "Meta", icon: "M" },
  { name: "Utmify", icon: "U" },
  { name: "Otimizey", icon: "O" },
  { name: "Vega", icon: "V" },
  { name: "Google", icon: "G" },
  { name: "Shopify", icon: "S" },
  { name: "Kiwify", icon: "K" },
];

export function Integrations() {
  return (
    <section className="py-16 relative overflow-hidden bg-gradient-to-b from-black to-zinc-950">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Hyperion Pay esta conectada a integracoes amplas e flexiveis
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conecte-se com as principais plataformas e servicos do mercado para automatizar seu negocio e maximizar seus resultados.
          </p>
        </motion.div>

        {/* Logos Marquee */}
        <div className="relative overflow-hidden py-8">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
          
          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
            className="flex gap-12 items-center"
          >
            {[...integrations, ...integrations, ...integrations].map((integration, index) => (
              <div
                key={`${integration.name}-${index}`}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
              >
                <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold">
                  {integration.icon}
                </span>
                <span className="text-lg font-medium">{integration.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
