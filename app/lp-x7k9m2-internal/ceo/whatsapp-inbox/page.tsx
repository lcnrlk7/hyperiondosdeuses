"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  Bot,
  User,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface Conversation {
  id: number;
  phone: string;
  name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  handled_by: "bot" | "human";
  status: "open" | "closed";
  updated_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  direction: "in" | "out";
  sender: "customer" | "bot" | "admin";
  content: string;
  created_at: string;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhone(phone: string): string {
  // 5563992032973 -> +55 63 99203-2973 (best effort)
  const d = phone.replace(/\D/g, "");
  if (d.length >= 12) {
    const ddi = d.slice(0, 2);
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    return `+${ddi} ${ddd} ${rest}`;
  }
  return phone;
}

export default function WhatsAppInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-inbox");
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {
      // silencioso
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (id: number, showSpinner = false) => {
      if (showSpinner) setLoadingThread(true);
      try {
        const res = await fetch(`/api/admin/whatsapp-inbox/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages ?? []);
        setActiveConv(data.conversation ?? null);
      } catch {
        // silencioso
      } finally {
        if (showSpinner) setLoadingThread(false);
      }
    },
    []
  );

  // Polling da lista de conversas
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, 5000);
    return () => clearInterval(t);
  }, [loadConversations]);

  // Polling da conversa ativa
  useEffect(() => {
    if (activeId == null) return;
    loadMessages(activeId, true);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  // Auto-scroll para a ultima mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || activeId == null) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    try {
      const res = await fetch(`/api/admin/whatsapp-inbox/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", text }),
      });
      if (res.ok) {
        await loadMessages(activeId);
        await loadConversations();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao enviar mensagem");
        setInput(text);
      }
    } catch {
      alert("Erro ao enviar mensagem");
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  async function toggleHandler(action: "takeover" | "release") {
    if (activeId == null) return;
    try {
      await fetch(`/api/admin/whatsapp-inbox/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadMessages(activeId);
      await loadConversations();
    } catch {
      // silencioso
    }
  }

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unread_count || 0),
    0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
      <header className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Atendimento WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Conversas em tempo real com o chatbot e atendentes
            {totalUnread > 0 ? ` · ${totalUnread} nao lidas` : ""}
          </p>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 rounded-2xl border border-border overflow-hidden bg-card">
        {/* Lista de conversas */}
        <aside
          className={`${
            activeId != null ? "hidden md:flex" : "flex"
          } w-full md:w-80 lg:w-96 flex-col border-r border-border bg-secondary/20`}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold text-white">Conversas</span>
            <button
              onClick={loadConversations}
              className="text-muted-foreground hover:text-white"
              aria-label="Atualizar lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma conversa ainda. Quando um cliente enviar mensagem no
                WhatsApp, ela aparece aqui.
              </div>
            ) : (
              <ul>
                {conversations.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/40 transition ${
                        activeId === c.id ? "bg-secondary/60" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white truncate">
                          {c.name || formatPhone(c.phone)}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-sm text-muted-foreground truncate">
                          {c.last_message || "—"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.handled_by === "human" ? (
                            <User className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-primary" />
                          )}
                          {c.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Thread da conversa */}
        <section
          className={`${
            activeId == null ? "hidden md:flex" : "flex"
          } flex-1 flex-col min-w-0`}
        >
          {activeId == null ? (
            <div className="flex flex-1 items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Selecione uma conversa para ver as mensagens.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cabecalho da conversa */}
              <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveId(null)}
                    className="md:hidden text-muted-foreground hover:text-white"
                    aria-label="Voltar"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {activeConv?.name || formatPhone(activeConv?.phone ?? "")}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {activeConv?.handled_by === "human" ? (
                        <>
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          Em atendimento humano
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5 text-primary" />
                          Respondendo pelo chatbot
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {activeConv?.handled_by === "human" ? (
                  <button
                    onClick={() => toggleHandler("release")}
                    className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-secondary/40 text-white"
                  >
                    Devolver ao bot
                  </button>
                ) : (
                  <button
                    onClick={() => toggleHandler("takeover")}
                    className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-black"
                  >
                    Assumir conversa
                  </button>
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
                {loadingThread && messages.length === 0 ? (
                  <div className="flex items-center justify-center p-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOut = m.direction === "out";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isOut ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isOut
                              ? m.sender === "bot"
                                ? "bg-primary/15 text-white rounded-br-sm"
                                : "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary text-white rounded-bl-sm"
                          }`}
                        >
                          {isOut && (
                            <div className="flex items-center gap-1 mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
                              {m.sender === "bot" ? (
                                <>
                                  <Bot className="w-3 h-3" /> Chatbot
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3" /> Atendente
                                </>
                              )}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {m.content}
                          </p>
                          <div className="text-[10px] opacity-60 text-right mt-1">
                            {formatTime(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Campo de envio */}
              <div className="p-3 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escreva uma mensagem..."
                    className="flex-1 rounded-xl bg-secondary/40 border border-border px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                    aria-label="Enviar"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Ao enviar, a conversa passa para atendimento humano (o bot para
                  de responder automaticamente).
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
