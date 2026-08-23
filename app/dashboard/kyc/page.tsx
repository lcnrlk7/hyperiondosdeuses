"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, FileImage, Loader2, ShieldCheck, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DocType = "document_front" | "document_back" | "selfie_with_document";
const fields: Array<{ type: DocType; title: string; description: string }> = [
  { type: "document_front", title: "Frente do documento", description: "RG, CNH ou documento oficial, legível e sem cortes." },
  { type: "document_back", title: "Verso do documento", description: "Fotografe todo o verso, com boa iluminação." },
  { type: "selfie_with_document", title: "Selfie com o documento", description: "Segure o documento ao lado do rosto; ambos devem estar nítidos." },
];

interface KycData { kyc_status: string; rejection_reason?: string | null; documents: Array<{ document_type: DocType; file_name: string; status: string }> }

export default function KycPage() {
  const [data, setData] = useState<KycData>({ kyc_status: "not_started", documents: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/kyc/documents", { cache: "no-store" });
    if (response.ok) setData(await response.json());
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function upload(type: DocType, file?: File) {
    if (!file) return;
    setUploading(type); setError(null);
    const form = new FormData(); form.set("file", file); form.set("documentType", type);
    const response = await fetch("/api/kyc/upload", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Falha ao enviar documento");
    await load(); setUploading(null);
  }

  if (loading) return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  const approved = data.kyc_status === "approved";
  const rejected = data.kyc_status === "rejected";
  const complete = fields.every((field) => data.documents.some((doc) => doc.document_type === field.type));

  return <div className="mx-auto flex max-w-5xl flex-col gap-6">
    <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p className="font-mono text-sm text-primary">SEGURANÇA DA CONTA</p><h1 className="text-balance font-sans text-3xl font-bold">Verificação manual de identidade</h1><p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">Envie as três imagens. Somente CEO e Manager podem visualizá-las; os arquivos permanecem criptografados.</p></div>
      <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm">{approved ? <CheckCircle2 className="size-5 text-emerald-500" /> : rejected ? <XCircle className="size-5 text-destructive" /> : <Clock className="size-5 text-primary" />}<span>{approved ? "Aprovado" : rejected ? "Reprovado" : complete ? "Em análise" : "Documentos pendentes"}</span></div>
    </header>
    {data.rejection_reason && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><strong>Motivo da reprovação:</strong> {data.rejection_reason}</div>}
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {approved ? <Card><CardContent className="flex flex-col items-center gap-4 p-10 text-center"><ShieldCheck className="size-14 text-emerald-500" /><h2 className="text-xl font-bold">Identidade aprovada</h2><p className="text-muted-foreground">Sua conta foi verificada manualmente pela equipe de segurança.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-3">{fields.map((field) => {
      const doc = data.documents.find((item) => item.document_type === field.type);
      return <Card key={field.type} className="overflow-hidden"><CardContent className="flex h-full flex-col gap-4 p-5"><div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileImage className="size-5" /></div><div className="flex-1"><h2 className="font-semibold">{field.title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{field.description}</p>{doc && <p className="mt-3 truncate text-sm font-medium text-primary">Enviado: {doc.file_name}</p>}</div><label className="block"><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={(event) => void upload(field.type, event.target.files?.[0])} /><Button className="w-full" type="button" variant={doc ? "outline" : "default"} disabled={uploading !== null} asChild><span>{uploading === field.type ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{doc ? "Substituir imagem" : "Enviar imagem"}</span></Button></label></CardContent></Card>;
    })}</div>}
    {!approved && complete && <div className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">Os três documentos foram enviados e estão aguardando análise manual.</div>}
  </div>;
}
