"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileCheck,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  X,
  AlertTriangle,
  Loader2,
  ZoomIn,
  ShieldCheck,
} from "lucide-react";

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  file_name: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  viewUrl?: string;
}

interface UserKYC {
  id: string;
  email: string;
  name: string | null;
  kyc_status: string;
  created_at: string;
  documents: KYCDocument[];
}

export default function KYCPage() {
  const [users, setUsers] = useState<UserKYC[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserKYC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserKYC | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (filter !== "all") {
      filtered = filtered.filter((user) => user.kyc_status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filter, users]);

  async function loadUsers() {
    try {
      const response = await fetch("/api/admin/kyc");
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error("[v0] Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const [actionLoading, setActionLoading] = useState(false);

  async function approveUser(user: UserKYC) {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action: "approve" }),
      });

      if (response.ok) {
        loadUsers();
        setShowModal(false);
      } else {
        alert("Erro ao aprovar usuário");
      }
    } catch (error) {
      console.error("[v0] Error approving user:", error);
      alert("Erro ao aprovar usuário");
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectUser(user: UserKYC) {
    if (!rejectionReason) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          action: "reject", 
          rejectionReason 
        }),
      });

      if (response.ok) {
        loadUsers();
        setShowModal(false);
        setRejectionReason("");
      } else {
        alert("Erro ao rejeitar usuário");
      }
    } catch (error) {
      console.error("[v0] Error rejecting user:", error);
      alert("Erro ao rejeitar usuário");
    } finally {
      setActionLoading(false);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "identity":
        return "Documento de Identidade";
      case "address_proof":
        return "Comprovante de Residência";
      case "selfie":
        return "Selfie com Documento";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-secondary rounded-lg" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Aviso: verificacao agora e automatica */}
      <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Verificação automática ativada</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            O KYC agora é aprovado automaticamente pela verificação de prova de vida (biometria).
            Não é mais necessário analisar documentos manualmente — os usuários são liberados assim
            que concluem a prova de vida. Esta tela é mantida apenas para consulta e casos excepcionais.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Verificação KYC</h1>
          <p className="text-muted-foreground">
            Analise e aprove documentos de verificação
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-48"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="all" className="bg-card">
              Todos
            </option>
            <option value="pending" className="bg-card">
              Pendente/Enviado
            </option>
            <option value="submitted" className="bg-card">
              Aguardando Análise
            </option>
            <option value="approved" className="bg-card">
              Aprovados
            </option>
            <option value="rejected" className="bg-card">
              Rejeitados
            </option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
          <p className="text-sm text-muted-foreground">Total Usuários</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-400">
            {users.filter((u) => u.kyc_status === "pending" && u.documents.length === 0).length}
          </p>
          <p className="text-sm text-muted-foreground">Não Enviado</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {users.filter((u) => u.kyc_status === "submitted" || (u.kyc_status === "pending" && u.documents.length > 0)).length}
          </p>
          <p className="text-sm text-muted-foreground">Aguardando</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {users.filter((u) => u.kyc_status === "approved").length}
          </p>
          <p className="text-sm text-muted-foreground">Aprovados</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-2xl font-bold text-red-400">
            {users.filter((u) => u.kyc_status === "rejected").length}
          </p>
          <p className="text-sm text-muted-foreground">Rejeitados</p>
        </div>
      </div>

      {/* Users List */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    user.kyc_status === "approved" 
                      ? "bg-green-500/10" 
                      : user.kyc_status === "rejected"
                      ? "bg-red-500/10"
                      : user.documents.length > 0
                      ? "bg-yellow-500/10"
                      : "bg-gray-500/10"
                  }`}>
                    {user.kyc_status === "approved" ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : user.kyc_status === "rejected" ? (
                      <XCircle className="w-6 h-6 text-red-400" />
                    ) : user.documents.length > 0 ? (
                      <FileCheck className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.name || "Sem nome"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.documents.length} documento(s) enviado(s) - Cadastro: {formatDate(user.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.kyc_status === "approved"
                        ? "bg-green-400/10 text-green-400"
                        : user.kyc_status === "rejected"
                        ? "bg-red-400/10 text-red-400"
                        : user.kyc_status === "submitted" || user.documents.length > 0
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "bg-gray-400/10 text-gray-400"
                    }`}
                  >
                    {user.kyc_status === "approved"
                      ? "Aprovado"
                      : user.kyc_status === "rejected"
                      ? "Rejeitado"
                      : user.kyc_status === "submitted" || user.documents.length > 0
                      ? "Aguardando Análise"
                      : "Não Enviado"}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Verificação KYC - {selectedUser.name || selectedUser.email}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações do usuário */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome</p>
                  <p className="text-foreground">{selectedUser.name || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedUser.kyc_status === "approved"
                        ? "bg-green-400/10 text-green-400"
                        : selectedUser.kyc_status === "rejected"
                        ? "bg-red-400/10 text-red-400"
                        : selectedUser.documents.length > 0
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "bg-gray-400/10 text-gray-400"
                    }`}
                  >
                    {selectedUser.kyc_status === "approved"
                      ? "Aprovado"
                      : selectedUser.kyc_status === "rejected"
                      ? "Rejeitado"
                      : selectedUser.documents.length > 0
                      ? "Aguardando Análise"
                      : "Não Enviado"}
                  </span>
                </div>
              </div>

              {/* Documentos */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Documentos Enviados ({selectedUser.documents.length})</p>
                {selectedUser.documents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-yellow-400">Nenhum documento enviado ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.documents.map((doc) => {
                      // Se viewUrl existe, usar. Senão, se file_url começa com http é URL pública, usar direto
                      const docUrl = doc.viewUrl 
                        ? doc.viewUrl 
                        : doc.file_url?.startsWith('http') 
                          ? doc.file_url 
                          : `/api/kyc/file?pathname=${encodeURIComponent(doc.file_url)}`;
                      const isImage = doc.file_url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) || doc.file_url?.includes('blob.vercel-storage.com');
                      
                      return (
                        <div key={doc.id} className="rounded-xl bg-secondary border border-border overflow-hidden">
                          <div className="p-3 flex items-center justify-between border-b border-border">
                            <div>
                              <p className="font-medium text-foreground text-sm">{getDocumentTypeLabel(doc.document_type)}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                            </div>
                            <div className="flex gap-2">
                              {isImage && (
                                <button
                                  onClick={() => setImagePreview({ url: docUrl, title: getDocumentTypeLabel(doc.document_type) })}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors text-blue-400 text-xs"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  Ampliar
                                </button>
                              )}
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors text-primary text-xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Abrir
                              </a>
                            </div>
                          </div>
                          {/* Preview da imagem */}
                          {isImage && (
                            <div 
                              className="p-3 bg-black/30 cursor-pointer hover:bg-black/40 transition-colors"
                              onClick={() => setImagePreview({ url: docUrl, title: getDocumentTypeLabel(doc.document_type) })}
                            >
                              <img 
                                src={docUrl} 
                                alt={getDocumentTypeLabel(doc.document_type)}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.parentElement!.innerHTML = '<div class="flex flex-col items-center justify-center h-48 text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-sm mt-2">Erro ao carregar imagem</p></div>';
                                }}
                              />
                            </div>
                          )}
                          {/* PDF indicator */}
                          {doc.file_url?.match(/\.pdf$/i) && (
                            <div className="p-4 bg-black/20 text-center">
                              <FileCheck className="w-10 h-10 text-primary mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">PDF - Clique em Abrir</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ações */}
              {selectedUser.kyc_status !== "approved" && (
                <>
                  {selectedUser.documents.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Motivo da Rejeicao (se aplicavel)
                      </p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Informe o motivo caso rejeite a verificacao..."
                        className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-24"
                      />
                    </div>
                  )}

                  {selectedUser.documents.length === 0 && (
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-400">Aprovacao sem documentos</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Este usuario nao enviou documentos. Ao aprovar, ele tera acesso completo a plataforma.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {selectedUser.documents.length > 0 && (
                      <button
                        onClick={() => rejectUser(selectedUser)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                        Rejeitar
                      </button>
                    )}
                    <button
                      onClick={() => approveUser(selectedUser)}
                      disabled={actionLoading}
                      className={`${selectedUser.documents.length > 0 ? 'flex-1' : 'w-full'} px-4 py-3 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {selectedUser.documents.length === 0 ? "Aprovar sem Documentos" : "Aprovar Usuario"}
                    </button>
                  </div>
                </>
              )}

              {selectedUser.kyc_status === "approved" && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400">Este usuário já está verificado</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Visualização de Imagem Ampliada */}
      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4"
          onClick={() => setImagePreview(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-medium">{imagePreview.title}</h3>
              <div className="flex gap-2">
                <a
                  href={imagePreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-foreground text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em nova aba
                </a>
                <button
                  onClick={() => setImagePreview(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img 
              src={imagePreview.url} 
              alt={imagePreview.title}
              className="max-w-full max-h-[80vh] mx-auto rounded-xl object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '';
                target.alt = 'Erro ao carregar imagem';
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
