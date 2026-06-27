"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileCheck, 
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Home,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  viewUrl?: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  name?: string;
  email?: string;
}

export default function ManagerKYCPage() {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedDoc, setSelectedDoc] = useState<KYCDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/kyc?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
    setLoading(false);
  };

  const handleApprove = async (doc: KYCDocument) => {
    setProcessing(true);
    try {
      await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          documentId: doc.id,
          userId: doc.user_id,
        }),
      });
      loadDocuments();
      setSelectedDoc(null);
    } catch (error) {
      console.error("Error approving:", error);
    }
    setProcessing(false);
  };

  const handleReject = async (doc: KYCDocument) => {
    if (!rejectionReason.trim()) return;
    
    setProcessing(true);
    try {
      await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          documentId: doc.id,
          userId: doc.user_id,
          reason: rejectionReason,
        }),
      });
      loadDocuments();
      setSelectedDoc(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting:", error);
    }
    setProcessing(false);
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case "identity": return CreditCard;
      case "address_proof": return Home;
      case "selfie": return Camera;
      default: return FileCheck;
    }
  };

  const getDocTypeName = (type: string) => {
    switch (type) {
      case "identity": return "Documento de Identidade";
      case "address_proof": return "Comprovante de Endereço";
      case "selfie": return "Selfie com Documento";
      default: return type;
    }
  };

  const filters = [
    { value: "pending", label: "Pendentes" },
    { value: "approved", label: "Aprovados" },
    { value: "rejected", label: "Rejeitados" },
    { value: "all", label: "Todos" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Aprovação de KYC
        </h1>
        <p className="text-muted-foreground mt-1">
          Revise e aprove documentos de verificação
        </p>
      </div>

      {/* Aviso: verificacao agora e automatica */}
      <div className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Verificação automática ativada</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            O KYC agora é aprovado automaticamente pela verificação de prova de vida (biometria).
            Não é mais necessário analisar documentos manualmente — os usuários são liberados assim
            que concluem a prova de vida. Esta tela é mantida apenas para consulta.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value as typeof filter)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="glass border-border">
          <CardContent className="py-12 text-center">
            <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum documento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc, index) => {
            const DocIcon = getDocTypeIcon(doc.document_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          doc.status === "approved" ? "bg-green-500/20" :
                          doc.status === "rejected" ? "bg-red-500/20" :
                          "bg-yellow-500/20"
                        }`}>
                          <DocIcon className={`w-6 h-6 ${
                            doc.status === "approved" ? "text-green-500" :
                            doc.status === "rejected" ? "text-red-500" :
                            "text-yellow-500"
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {doc.name || doc.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getDocTypeName(doc.document_type)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enviado em {new Date(doc.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                          doc.status === "approved" ? "bg-green-500/20 text-green-500" :
                          doc.status === "rejected" ? "bg-red-500/20 text-red-500" :
                          "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {doc.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> :
                           doc.status === "rejected" ? <XCircle className="w-4 h-4" /> :
                           <Clock className="w-4 h-4" />}
                          {doc.status === "approved" ? "Aprovado" :
                           doc.status === "rejected" ? "Rejeitado" : "Pendente"}
                        </div>

                        {doc.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Revisar
                          </Button>
                        )}
                      </div>
                    </div>

                    {doc.rejection_reason && (
                      <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-red-500 text-sm">
                          <strong>Motivo:</strong> {doc.rejection_reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">
              Revisar Documento
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground">Usuário</p>
                <p className="font-medium text-foreground">
                  {selectedDoc.name || selectedDoc.email}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                <p className="font-medium text-foreground">
                  {getDocTypeName(selectedDoc.document_type)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-secondary">
                <p className="text-sm text-muted-foreground mb-2">Arquivo</p>
                <a
                  href={selectedDoc.viewUrl || selectedDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Ver documento
                </a>
                {/* Preview da imagem */}
                {(selectedDoc.file_url?.match(/\.(jpg|jpeg|png|webp|gif)$/i) || selectedDoc.file_url?.includes('blob.vercel-storage.com')) && (
                  <div className="mt-3">
                    <img 
                      src={selectedDoc.viewUrl || selectedDoc.file_url}
                      alt="Preview do documento"
                      className="max-w-full max-h-48 rounded-lg object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Motivo da rejeição (obrigatório para rejeitar)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Documento ilegível, foto cortada..."
                  className="w-full h-24 p-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedDoc(null);
                    setRejectionReason("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(selectedDoc)}
                  disabled={processing || !rejectionReason.trim()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedDoc)}
                  disabled={processing}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
