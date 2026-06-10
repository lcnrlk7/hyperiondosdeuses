"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Home,
  Wallet,
  CreditCard,
  FileText,
  Settings,
  Key,
  Shield,
  HelpCircle,
  Search,
  X,
  Users,
  ShoppingCart,
} from "lucide-react";

interface Shortcut {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  category: "navigation" | "actions" | "help";
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const shortcuts: Shortcut[] = [
    // Navigation
    {
      key: "g h",
      label: "Dashboard",
      description: "Ir para pagina inicial",
      icon: Home,
      action: () => router.push("/dashboard"),
      category: "navigation",
    },
    {
      key: "g w",
      label: "Carteira",
      description: "Ir para carteira",
      icon: Wallet,
      action: () => router.push("/dashboard/wallet"),
      category: "navigation",
    },
    {
      key: "g t",
      label: "Transacoes",
      description: "Ver todas transacoes",
      icon: CreditCard,
      action: () => router.push("/dashboard/transactions"),
      category: "navigation",
    },
    {
      key: "g r",
      label: "Relatorios",
      description: "Ver relatorios",
      icon: FileText,
      action: () => router.push("/dashboard/reports"),
      category: "navigation",
    },
    {
      key: "g c",
      label: "Checkout",
      description: "Gerenciar checkouts",
      icon: ShoppingCart,
      action: () => router.push("/dashboard/checkout"),
      category: "navigation",
    },
    {
      key: "g a",
      label: "Afiliados",
      description: "Ver afiliados",
      icon: Users,
      action: () => router.push("/dashboard/affiliates"),
      category: "navigation",
    },
    {
      key: "g i",
      label: "Integracao",
      description: "Configurar API",
      icon: Key,
      action: () => router.push("/dashboard/integration"),
      category: "navigation",
    },
    {
      key: "g s",
      label: "Seguranca",
      description: "Configuracoes de seguranca",
      icon: Shield,
      action: () => router.push("/dashboard/security"),
      category: "navigation",
    },
    {
      key: "g p",
      label: "Perfil",
      description: "Editar perfil",
      icon: Settings,
      action: () => router.push("/dashboard/profile"),
      category: "navigation",
    },
    // Actions
    {
      key: "ctrl k",
      label: "Busca rapida",
      description: "Abrir busca global",
      icon: Search,
      action: () => setShowSearch(true),
      category: "actions",
    },
    // Help
    {
      key: "?",
      label: "Atalhos",
      description: "Mostrar esta ajuda",
      icon: HelpCircle,
      action: () => setShowHelp(true),
      category: "help",
    },
  ];

  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorar se estiver em input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Reset sequence if too much time passed
      if (now - lastKeyTime > 1000) {
        setKeySequence([]);
      }
      setLastKeyTime(now);

      // Handle Ctrl+K for search
      if ((e.ctrlKey || e.metaKey) && key === "k") {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      // Handle ? for help
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Handle Escape
      if (key === "escape") {
        setShowHelp(false);
        setShowSearch(false);
        setKeySequence([]);
        return;
      }

      // Build key sequence (for g + letter shortcuts)
      const newSequence = [...keySequence, key].slice(-2);
      setKeySequence(newSequence);

      // Check for matching shortcut
      const sequenceStr = newSequence.join(" ");
      const shortcut = shortcuts.find((s) => s.key === sequenceStr);

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
        setKeySequence([]);
      }
    },
    [keySequence, lastKeyTime, shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Quick search
  const filteredShortcuts = searchQuery
    ? shortcuts.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <>
      {/* Keyboard Shortcut Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Command className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Atalhos de Teclado</h2>
                    <p className="text-sm text-muted-foreground">Navegue mais rapido pelo sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {/* Navigation */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Navegacao
                  </h3>
                  <div className="grid gap-2">
                    {shortcuts
                      .filter((s) => s.category === "navigation")
                      .map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                          onClick={() => {
                            shortcut.action();
                            setShowHelp(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <shortcut.icon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{shortcut.label}</p>
                              <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Acoes
                  </h3>
                  <div className="grid gap-2">
                    {shortcuts
                      .filter((s) => s.category === "actions")
                      .map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <shortcut.icon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{shortcut.label}</p>
                              <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                            {shortcut.key.replace("ctrl", "Ctrl +")}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Help */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Ajuda
                  </h3>
                  <div className="grid gap-2">
                    {shortcuts
                      .filter((s) => s.category === "help")
                      .map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50"
                        >
                          <div className="flex items-center gap-3">
                            <shortcut.icon className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{shortcut.label}</p>
                              <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                            </div>
                          </div>
                          <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-secondary/30">
                <p className="text-xs text-muted-foreground text-center">
                  Pressione <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">ESC</kbd> para fechar
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar paginas, acoes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="px-2 py-1 bg-secondary border border-border rounded text-xs font-mono text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {searchQuery && (
                <div className="p-2 max-h-80 overflow-y-auto">
                  {filteredShortcuts.length > 0 ? (
                    filteredShortcuts.map((shortcut) => (
                      <button
                        key={shortcut.key}
                        onClick={() => {
                          shortcut.action();
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                      >
                        <shortcut.icon className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{shortcut.label}</p>
                          <p className="text-xs text-muted-foreground">{shortcut.description}</p>
                        </div>
                        <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-muted-foreground">
                          {shortcut.key}
                        </kbd>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum resultado encontrado
                    </p>
                  )}
                </div>
              )}

              {!searchQuery && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Digite para buscar paginas e acoes
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Help Button (mobile hidden) */}
      <div className="fixed bottom-4 right-4 z-50 hidden lg:block">
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl shadow-lg hover:bg-secondary transition-colors text-sm text-muted-foreground"
        >
          <Command className="w-4 h-4" />
          <span>?</span>
        </button>
      </div>
    </>
  );
}
