"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  MessageCircle,
  Send,
  Paperclip,
  X,
  Loader2,
  CheckCircle,
  ChevronLeft,
  User,
  FileText,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Trash2,
  MoreVertical,
} from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  admin_name: string | null;
  assigned_admin_id: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  sender_name: string;
  sender_avatar: string | null;
  sender_role: string;
  message: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  is_read: boolean;
}

interface Admin {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface Stats {
  open_count: number;
  in_progress_count: number;
  closed_count: number;
  unassigned_count: number;
}

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "financial", label: "Financeiro" },
  { value: "technical", label: "Tecnico" },
  { value: "account", label: "Conta" },
  { value: "api", label: "API/Integracao" },
  { value: "withdrawal", label: "Saques" },
  { value: "other", label: "Outros" },
];

const PRIORITIES = [
  { value: "low", label: "Baixa", color: "text-muted-foreground", bg: "bg-muted" },
  { value: "normal", label: "Normal", color: "text-blue-400", bg: "bg-blue-500/20" },
  { value: "high", label: "Alta", color: "text-orange-400", bg: "bg-orange-500/20" },
  { value: "urgent", label: "Urgente", color: "text-red-400", bg: "bg-red-500/20" },
];

const STATUSES = [
  { value: "open", label: "Aberto", color: "text-green-400", bg: "bg-green-500/20" },
  { value: "in_progress", label: "Em Atendimento", color: "text-blue-400", bg: "bg-blue-500/20" },
  { value: "closed", label: "Encerrado", color: "text-muted-foreground", bg: "bg-muted" },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<{ ticket: Ticket; user_phone?: string; user_since?: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<Stats>({ open_count: 0, in_progress_count: 0, closed_count: 0, unassigned_count: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, assignedFilter]);

  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(() => loadMessages(selectedTicket.id, true), 3000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  // Scroll apenas quando novas mensagens chegam (nao no polling)
  useEffect(() => {
    if (messages.length > prevMessagesLength) {
      scrollToBottom();
    }
    setPrevMessagesLength(messages.length);
  }, [messages.length, prevMessagesLength]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadTickets() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (assignedFilter !== "all") params.append("assignedTo", assignedFilter);
      
      const response = await fetch(`/api/admin/tickets?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.tickets) setTickets(data.tickets);
        if (data.stats) setStats(data.stats);
        if (data.admins) setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(ticketId: string, silent = false) {
    if (!silent) setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`);
      const data = await response.json();
      if (data.messages) setMessages(data.messages);
      if (data.ticket) {
        setSelectedTicket(data.ticket);
        setTicketDetails({ ticket: data.ticket, user_phone: data.ticket.user_phone, user_since: data.ticket.user_since });
      }
      if (data.admins) setAdmins(data.admins);
      if (data.currentAdmin) setCurrentAdmin(data.currentAdmin);
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

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const response = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage("");
        setMessages([...messages, data.message]);
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
        const response = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Anexo: ${uploadData.name}`, attachmentUrl: uploadData.url, attachmentType: uploadData.type }),
        });
        const data = await response.json();
        if (data.success) {
          setMessages([...messages, data.message]);
          loadTickets();
        }
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleUpdateTicket(field: string, value: string | null) {
    if (!selectedTicket) return;
    try {
      await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      loadTickets();
      loadMessages(selectedTicket.id);
    } catch (error) {
      console.error("Erro ao atualizar ticket:", error);
    }
  }

  async function handleDeleteTicket() {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/tickets/${ticketToDelete.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        if (selectedTicket?.id === ticketToDelete.id) {
          setSelectedTicket(null);
          setMessages([]);
        }
        loadTickets();
        setShowDeleteModal(false);
        setTicketToDelete(null);
      }
    } catch (error) {
      console.error("Erro ao excluir ticket:", error);
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteModal(ticket: Ticket, e: React.MouseEvent) {
    e.stopPropagation();
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  }

  function getStatusBadge(status: string) {
    const s = STATUSES.find((st) => st.value === status);
    return <span className={`px-2 py-0.5 rounded-full text-xs ${s?.bg} ${s?.color}`}>{s?.label || status}</span>;
  }

  function getPriorityBadge(priority: string) {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return <span className={`px-2 py-0.5 rounded-full text-xs ${p?.bg} ${p?.color}`}>{p?.label || priority}</span>;
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

  const filteredTickets = tickets.filter((t) => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Central de Tickets</h1>
            <p className="text-sm text-muted-foreground">Gerencie os chamados de suporte</p>
          </div>
          <Button variant="outline" onClick={() => loadTickets()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.open_count}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.in_progress_count}</p>
                <p className="text-xs text-muted-foreground">Em Atendimento</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.unassigned_count}</p>
                <p className="text-xs text-muted-foreground">Sem Atribuicao</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.closed_count}</p>
                <p className="text-xs text-muted-foreground">Encerrados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
          {/* Lista de Tickets */}
          <div className={`lg:col-span-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col ${selectedTicket ? "hidden lg:flex" : "flex"}`}>
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por assunto, nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground">
                  <option value="all">Todos Status</option>
                  <option value="open">Abertos</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="closed">Encerrados</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground">
                  {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
                <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)} className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground">
                  <option value="all">Todos</option>
                  <option value="me">Meus Tickets</option>
                  <option value="unassigned">Sem Atribuicao</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhum ticket encontrado</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div key={ticket.id} className={`relative group border-b border-border hover:bg-secondary/50 transition-colors ${selectedTicket?.id === ticket.id ? "bg-secondary" : ""}`}>
                    <button onClick={() => handleSelectTicket(ticket)} className="w-full p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            {ticket.unread_count > 0 && (
                              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{ticket.unread_count}</span>
                            )}
                          </div>
                          <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                          <div className="mt-1">
                            <p className="text-xs text-white font-medium">{ticket.user_name || "Sem nome"}</p>
                            <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}</span>
                            {ticket.admin_name && (<><span className="text-xs text-muted-foreground">•</span><span className="text-xs text-primary">{ticket.admin_name}</span></>)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(ticket.last_message_at)}</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(ticket, e)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                      title="Excluir ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat + Detalhes */}
          <div className={`lg:col-span-2 flex gap-4 ${!selectedTicket ? "hidden lg:flex" : "flex"}`}>
            {/* Chat */}
            <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              {selectedTicket ? (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 hover:bg-secondary rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {selectedTicket.user_avatar ? <Image src={selectedTicket.user_avatar} alt="" width={40} height={40} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">{selectedTicket.subject}</h2>
                        <p className="text-xs text-white">{selectedTicket.user_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                            {msg.sender_type === "user" && (
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                                {msg.sender_avatar ? <Image src={msg.sender_avatar} alt="" width={32} height={32} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            )}
                            <div className={`max-w-[70%] ${msg.sender_type === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"} rounded-2xl px-4 py-3`}>
                              {msg.sender_type === "admin" && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name} (Admin)</p>}
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              {msg.attachment_url && (
                                <div className="mt-2">
                                  {msg.attachment_type?.startsWith("image/") ? (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"><Image src={msg.attachment_url} alt="Anexo" width={200} height={150} className="rounded-lg max-w-full" /></a>
                                  ) : (
                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs underline"><FileText className="w-4 h-4" />Ver anexo</a>
                                  )}
                                </div>
                              )}
                              <p className="text-xs opacity-50 mt-1">{new Date(msg.created_at).toLocaleString("pt-BR")}</p>
                            </div>
                            {msg.sender_type === "admin" && (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                {msg.sender_avatar ? <Image src={msg.sender_avatar} alt="" width={32} height={32} className="w-full h-full object-cover rounded-full" /> : <User className="w-4 h-4 text-primary-foreground" />}
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
                        <Input placeholder="Digite sua resposta..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()} className="flex-1" />
                        <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-t border-border bg-secondary/50">
                      <p className="text-sm text-muted-foreground text-center">Este ticket foi encerrado</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Selecione um ticket</p>
                  <p className="text-sm">para visualizar a conversa</p>
                </div>
              )}
            </div>

            {/* Painel Lateral - Detalhes */}
            {selectedTicket && (
              <div className="hidden xl:block w-80 bg-card border border-border rounded-2xl p-4 space-y-4 overflow-y-auto">
                <h3 className="font-semibold text-foreground">Detalhes do Ticket</h3>
                
                {/* Info do Usuario */}
                <div className="p-3 bg-secondary/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {selectedTicket.user_avatar ? <Image src={selectedTicket.user_avatar} alt="" width={48} height={48} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedTicket.user_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                    </div>
                  </div>
                  {ticketDetails?.user_phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />{ticketDetails.user_phone}
                    </div>
                  )}
                  {ticketDetails?.user_since && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />Cliente desde {new Date(ticketDetails.user_since).toLocaleDateString("pt-BR")}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Status</label>
                  <select value={selectedTicket.status} onChange={(e) => handleUpdateTicket("status", e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
                    {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Prioridade</label>
                  <select value={selectedTicket.priority} onChange={(e) => handleUpdateTicket("priority", e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
                    {PRIORITIES.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                  </select>
                </div>

                {/* Atribuicao */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Atribuido para</label>
                  <select value={selectedTicket.assigned_admin_id || ""} onChange={(e) => handleUpdateTicket("assignedAdminId", e.target.value || null)} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
                    <option value="">Nao atribuido</option>
                    {admins.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Categoria</label>
                  <p className="text-sm text-foreground">{CATEGORIES.find((c) => c.value === selectedTicket.category)?.label}</p>
                </div>

                {/* Datas */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Criado em</span>
                    <span className="text-foreground">{new Date(selectedTicket.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ultima atividade</span>
                    <span className="text-foreground">{new Date(selectedTicket.last_message_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>

                {/* Botao Excluir */}
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTicketToDelete(selectedTicket);
                      setShowDeleteModal(true);
                    }}
                    className="w-full gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Ticket
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmacao de Exclusao */}
      <AnimatePresence>
        {showDeleteModal && ticketToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Excluir Ticket</h3>
                  <p className="text-sm text-muted-foreground">Esta acao nao pode ser desfeita</p>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl mb-6">
                <p className="text-sm text-foreground font-medium mb-1">{ticketToDelete.subject}</p>
                <p className="text-xs text-muted-foreground">{ticketToDelete.user_name || ticketToDelete.user_email}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(ticketToDelete.status)}
                  {getPriorityBadge(ticketToDelete.priority)}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Tem certeza que deseja excluir este ticket? Todas as mensagens e anexos serao removidos permanentemente.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1"
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteTicket}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
