"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Rocket, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import Image from "next/image";

const stats = [
  { value: "99.9%", label: "Uptime", icon: Rocket },
  { value: "<1s", label: "Resposta", icon: Clock },
  { value: "100%", label: "Seguro", icon: ShieldCheck },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-start justify-center overflow-hidden pt-20 md:pt-24"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]" />
      
      {/* Spotlight effect */}
      <div className="absolute inset-0 spotlight" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Floating orbs */}
      <motion.div
        style={{ y, opacity }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] float"
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px] float-delay-2"
      />
      
      {/* Animated lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "200%", opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className="absolute h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            style={{ top: `${20 + i * 15}%`, width: "50%" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Gateway de pagamento</span>
            <br />
            <span className="gradient-text glow-text">com a menor taxa do mercado</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-12 leading-relaxed"
          >
            Receba pagamentos online com rapidez, simplicidade e baixo custo.
            <br className="hidden md:block" />
            Integração fácil, checkout seguro e suporte sempre disponível.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16"
          >
            <Link href="/auth/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255, 122, 0, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-3 px-10 py-5 bg-primary text-black font-bold rounded-full text-lg overflow-hidden shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-400 to-primary bg-[length:200%_100%] animate-shimmer" />
                <span className="relative z-10">Começar Agora</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="/docs">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 122, 0, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-3 px-10 py-5 border-2 border-white/20 text-white font-semibold rounded-full text-lg hover:border-primary/50 transition-all duration-300"
              >
                Ver Documentação
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="p-3 rounded-xl glass group-hover:bg-primary/10 transition-colors">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/40">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Floating UI Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-3xl opacity-30" />
            <div className="relative glass rounded-2xl p-6 md:p-8 border border-border">
              {/* Mock Dashboard UI */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Image src="/images/logo-hyperion.png" alt="Logo" width={32} height={32} />
                  <span className="font-semibold text-white">Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-primary" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Saldo Disponível", value: "R$ 12.450,00" },
                  { label: "Recebido Hoje", value: "R$ 3.280,50" },
                  { label: "Taxa do Mês", value: "R$ 245,30" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-secondary border border-border">
                    <div className="text-xs text-white/40 mb-1">{item.label}</div>
                    <div className="text-xl font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
              
              <div className="h-32 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-end p-4">
                <div className="flex items-end gap-2 w-full">
                  {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 90, 65].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1 + i * 0.05, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
