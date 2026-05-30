"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  MessageCircle,
  Plus,
  Send,
  Paperclip,
  X,
  Loader2,
  CheckCircle,
  ChevronLeft,
  User,
  FileText,
  Search,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  admin_name: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  sender_name: string;
  sender_avatar: string | null;
  message: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  is_read: boolean;
}

const CATEGORIES = [
  { value: "financial", label: "Financeiro" },
  { value: "technical", label: "Tecnico" },
  { value: "account", label: "Conta" },
  { value: "api", label: "API/Integracao" },
  { value: "withdrawal", label: "Saques" },
  { value: "other", label: "Outros" },
];

const PRIORITIES = [
  { value: "low", label: "Baixa", color: "text-muted-foreground" },
  { value: "normal", label: "Normal", color: "text-blue-400" },
  { value: "high", label: "Alta", color: "text-orange-400" },
  { value: "urgent", label: "Urgente", color: "text-red-400" },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "technical",
    priority: "normal",
    message: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(() => {
      loadMessages(selectedTicket.id, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadTickets() {
    try {
      const response = await fetch(`/api/user/tickets?status=${statusFilter}`);
      const data = await response.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(ticketId: string, silent = false) {
    if (!silent) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/user/tickets/${ticketId}`);
      const data = await response.json();
      if (data.messages) setMessages(data.messages);
      if (data.ticket) setSelectedTicket(data.ticket);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSelectTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    await loadMessages(ticket.id);
  }

  async function handleCreateTicket() {
    if (!newTicket.subject || !newTicket.message) {
      alert("Preencha todos os campos");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/user/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      const data = await response.json();
      if (data.success) {
        setShowNewTicket(false);
        setNewTicket({ subject: "", category: "technical", priority: "normal", message: "" });
        loadTickets();
        handleSelectTicket(data.ticket);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Erro ao criar ticket:", error);
    } finally {
      setCreating(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const response = await fetch(`/api/user/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage("");
        loadMessages(selectedTicket.id);
        loadTickets();
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/user/tickets/upload", { method: "POST", body: formData });
      const uploadData = await uploadResponse.json();
      if (uploadData.success) {
        await fetch(`/api/user/tickets/${selectedTicket.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Anexo: ${uploadData.name}`,
            attachmentUrl: uploadData.url,
            attachmentType: uploadData.type,
          }),
        });
        loadMessages(selectedTicket.id);
        loadTickets();
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCloseTicket() {
    if (!selectedTicket || !confirm("Tem certeza que deseja encerrar este chamado?")) return;
    try {
      await fetch(`/api/user/tickets/${selectedTicket.id}`, { method: "PATCH" });
      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error("Erro ao fechar ticket:", error);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "open": return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Aberto</span>;
      case "in_progress": return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">Em Atendimento</span>;
      case "closed": return <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">Encerrado</span>;
      default: return null;
    }
  }

  function getPriorityBadge(priority: string) {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return <span className={`text-xs ${p?.color || "text-muted-foreground"}`}>{p?.label || priority}</span>;
  }

  function formatDate(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("pt-BR");
  }

  const filteredTickets = tickets.filter((t) => t.subject.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
            <p className="text-sm text-muted-foreground">Central de atendimento - Tire suas duvidas</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowNewTicket(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Chamado
            </Button>
          </div>
        </div>

        {/* Suporte Alternativo */}
        <div className="mb-6 p-4 bg-card border border-border rounded-2xl">
          <p className="text-sm text-muted-foreground mb-3">Prefere outro canal de atendimento?</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://discord.gg/sGmMSYjdnA"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 text-[#5865F2] hover:from-[#5865F2]/20 hover:to-[#5865F2]/10 transition-all border border-[#5865F2]/20"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="font-medium text-sm">Suporte Discord</span>
            </a>
            <a
              href="https://wa.me/5534999353187"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 text-green-500 hover:from-green-500/20 hover:to-green-500/10 transition-all border border-green-500/20"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-medium text-sm">WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Lista de Tickets */}
          <div className={`lg:col-span-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col ${selectedTicket ? "hidden lg:flex" : "flex"}`}>
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar chamado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "open", "in_progress", "closed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                  >
                    {s === "all" ? "Todos" : s === "open" ? "Abertos" : s === "in_progress" ? "Em Atend." : "Encerrados"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhum chamado encontrado</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full p-4 border-b border-border text-left hover:bg-secondary/50 transition-colors ${selectedTicket?.id === ticket.id ? "bg-secondary" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(ticket.status)}
                          {ticket.unread_count > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{ticket.unread_count}</span>
                          )}
                        </div>
                        <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{CATEGORIES.find((c) => c.value === ticket.category)?.label}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(ticket.last_message_at)}</span>
                    </div>
                    {ticket.admin_name && <p className="text-xs text-muted-foreground mt-2">Atendente: {ticket.admin_name}</p>}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div className={`lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden flex flex-col ${!selectedTicket ? "hidden lg:flex" : "flex"}`}>
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 hover:bg-secondary rounded-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-semibold text-foreground">{selectedTicket.subject}</h2>
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusBadge(selectedTicket.status)}
                        {selectedTicket.admin_name && <span className="text-muted-foreground">Atendente: {selectedTicket.admin_name}</span>}
                      </div>
                    </div>
                  </div>
                  {selectedTicket.status !== "closed" && (
                    <Button variant="outline" size="sm" onClick={handleCloseTicket} className="text-muted-foreground">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Encerrar
                    </Button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                          {msg.sender_type === "admin" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {msg.sender_avatar ? <Image src={msg.sender_avatar} alt={msg.sender_name} width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${msg.sender_type === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"} rounded-2xl px-4 py-3`}>
                            {msg.sender_type === "admin" && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name}</p>}
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            {msg.attachment_url && (
                              <div className="mt-2">
                                {msg.attachment_type?.startsWith("image/") ? (
                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                    <Image src={msg.attachment_url} alt="Anexo" width={200} height={150} className="rounded-lg max-w-full" />
                                  </a>
                                ) : (
                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs underline">
                                    <FileText className="w-4 h-4" />Ver anexo
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-xs opacity-50 mt-1">{new Date(msg.created_at).toLocaleString("pt-BR")}</p>
                          </div>
                          {msg.sender_type === "user" && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" ? (
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
                      <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                      </Button>
                      <Input placeholder="Digite sua mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()} className="flex-1" />
                      <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border bg-secondary/50">
                    <p className="text-sm text-muted-foreground text-center">Este chamado foi encerrado</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione um chamado</p>
                <p className="text-sm">ou crie um novo para comecar</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Novo Ticket */}
        <AnimatePresence>
          {showNewTicket && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Novo Chamado</h2>
                  <button onClick={() => setShowNewTicket(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Assunto</label>
                    <Input placeholder="Descreva brevemente seu problema" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Categoria</label>
                      <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        {CATEGORIES.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Prioridade</label>
                      <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                        {PRIORITIES.map((pri) => (<option key={pri.value} value={pri.value}>{pri.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Mensagem</label>
                    <textarea placeholder="Descreva seu problema com detalhes..." value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" rows={5} />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowNewTicket(false)} className="flex-1">Cancelar</Button>
                  <Button onClick={handleCreateTicket} disabled={creating || !newTicket.subject || !newTicket.message} className="flex-1">
                    {creating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>) : (<><Plus className="w-4 h-4 mr-2" />Criar Chamado</>)}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
