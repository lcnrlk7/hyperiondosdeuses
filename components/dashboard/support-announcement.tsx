"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/IoqNR193nOW9UodggrGSQC";
const STORAGE_KEY = "hyperion_support_announcement_dismissed";

export function SupportAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se ja foi fechado nas ultimas 24h
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);
      if (hoursElapsed < 24) {
        return; // Nao mostrar se fechado ha menos de 24h
      }
    }
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4"
        >
          {/* Botao Fechar */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Icone */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
              </div>
            </div>

            {/* Conteudo */}
            <div className="flex-1 pr-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Novidade no Suporte Hyperion Pay
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Informamos que nosso suporte agora esta oficialmente pelo <strong className="text-foreground">site</strong> e pelo <strong className="text-foreground">WhatsApp</strong>.
                Para receber atendimento, utilize um desses canais. Tambem criamos uma comunidade no WhatsApp para networking!
              </p>

              {/* Botoes */}
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/support"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Suporte pelo Site
                </Link>
                <a
                  href="https://wa.me/5534999353187"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Suporte
                </a>
                <a
                  href={WHATSAPP_COMMUNITY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Comunidade Networking
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
