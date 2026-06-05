"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Link2,
  ChevronRight,
  Headphones,
  BadgeCheck,
  Percent,
  Zap,
  Shield,
  Users,
} from "lucide-react";

const links = [
  {
    title: "SITE OFICIAL - HYPERION PAY",
    description: "Acesse nossa plataforma e comece a vender.",
    href: "https://www.hyperionpay.com.br",
    icon: Link2,
    color: "from-primary to-orange-500",
  },
  {
    title: "GRUPO DE NETWORK - WHATSAPP",
    description: "Conecte-se e cresca junto com nossa comunidade.",
    href: "https://chat.whatsapp.com/JLfa7B2YmHT3LdjNGRXDCb?s=cl&p=i&ilr=2",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: "from-green-500 to-green-600",
  },
  {
    title: "GRUPO DE NETWORK - TELEGRAM",
    description: "Participe do nosso grupo exclusivo no Telegram.",
    href: "https://t.me/networkinghyperion",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    color: "from-blue-400 to-blue-500",
  },
  {
    title: "BOT OFICIAL - TELEGRAM",
    description: "Automacao, praticidade e controle na palma da mao.",
    href: "https://t.me/hyperionpay_bot",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5 1.5 1.5 0 0 0 7.5 16 1.5 1.5 0 0 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5z" />
      </svg>
    ),
    color: "from-purple-500 to-purple-600",
  },
  {
    title: "SUPORTE - WHATSAPP",
    description: "Fale com nossa equipe de suporte agora mesmo.",
    href: "https://wa.me/5534999353187",
    icon: Headphones,
    color: "from-emerald-500 to-emerald-600",
  },
  {
    title: "NUMERO OFICIAL",
    description: "Canal oficial de contato da Hyperion Pay.",
    href: "https://wa.me/5534999353187",
    icon: BadgeCheck,
    color: "from-cyan-500 to-blue-500",
  },
];

const benefits = [
  {
    icon: Percent,
    title: "TAXAS BAIXAS",
    description: "As melhores do mercado para voce lucrar mais.",
  },
  {
    icon: Zap,
    title: "APROVACAO ALTA",
    description: "Tecnologia avancada para mais conversoes e resultados.",
  },
  {
    icon: Shield,
    title: "100% SEGURO",
    description: "Protecao total para suas transacoes e seus dados.",
  },
  {
    icon: Users,
    title: "SUPORTE DEDICADO",
    description: "Equipe pronta para te ajudar sempre que precisar.",
  },
];

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-[#070b14] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 400),
              y: -10,
            }}
            animate={{
              y: typeof window !== "undefined" ? window.innerHeight + 10 : 800,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-blue-300 tracking-widest uppercase">
              Hyperion Pay
            </span>
          </div>

          {/* Logo */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="relative">
              <Image
                src="/images/logo-hyperion.png"
                alt="Hyperion Pay"
                width={60}
                height={60}
                className="relative z-10"
              />
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full scale-150" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">
            BEM-VINDO A
          </h1>
          <h2 className="text-2xl sm:text-3xl font-black mb-1">
            <span className="bg-gradient-to-r from-primary via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              MELHOR GATEWAY
            </span>
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            DO MOMENTO!
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
            Taxas baixas, aprovacao alta e a tecnologia mais avancada para
            impulsionar o seu negocio.
          </p>
        </motion.div>

        {/* Mascot - positioned to the right */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-16 sm:top-20 right-0 sm:right-4 w-32 sm:w-44 pointer-events-none hidden sm:block"
        >
          <Image
            src="/mascot.png"
            alt="Mascot"
            width={180}
            height={180}
            className="drop-shadow-2xl"
          />
        </motion.div>

        {/* Links */}
        <div className="space-y-2.5 mb-8">
          {links.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-[#0d1425] to-[#111a30] border border-white/5 hover:border-primary/40 hover:from-[#101830] hover:to-[#142040] transition-all duration-300 shadow-lg shadow-black/20"
                >
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}
                  >
                    <Icon />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
                      {link.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">
                      {link.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-b from-[#0c1322] to-[#0a0f1a] border border-white/5 rounded-2xl p-5"
        >
          <h4 className="text-center text-xs font-bold text-primary mb-5 tracking-widest uppercase">
            Por que escolher a Hyperion Pay?
          </h4>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                className="text-center p-2"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
                  <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h5 className="text-[10px] sm:text-xs font-bold text-white mb-0.5 uppercase tracking-wide">
                  {benefit.title}
                </h5>
                <p className="text-[9px] sm:text-[10px] text-gray-500 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-8 text-center"
        >
          {/* Logo Footer */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image
              src="/images/logo-hyperion.png"
              alt="Hyperion Pay"
              width={28}
              height={28}
            />
            <div className="flex flex-col items-start leading-none">
              <span className="text-base font-black tracking-widest text-white">
                HYPERION
              </span>
              <span className="text-[8px] tracking-[0.4em] text-gray-500 font-medium">
                PAY
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 mb-3">
            Impulsione seu negocio. Supere limites.
          </p>

          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
            <p className="text-[9px] text-gray-600">
              © 2024 Hyperion Pay - Todos os direitos reservados.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
