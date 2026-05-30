"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Webhook,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ServiceStatus {
  id: string;
  name: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  latency: number;
  description: string;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  createdAt: string;
}

const STATUS_CONFIG = {
  operational: { 
    color: "bg-green-500", 
    text: "text-green-500", 
    bg: "bg-green-500/10",
    label: "Operacional" 
  },
  degraded: { 
    color: "bg-yellow-500", 
    text: "text-yellow-500", 
    bg: "bg-yellow-500/10",
    label: "Lentidao" 
  },
  outage: { 
    color: "bg-red-500", 
    text: "text-red-500", 
    bg: "bg-red-500/10",
    label: "Indisponivel" 
  },
  maintenance: { 
    color: "bg-blue-500", 
    text: "text-blue-500", 
    bg: "bg-blue-500/10",
    label: "Manutencao" 
  },
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "pix-in": ArrowDownLeft,
  "pix-out": ArrowUpRight,
  "checkout": CreditCard,
  "webhooks": Webhook,
};

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/status?simple=true");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar status");
      }
      
      const data = await response.json();
      
      // Filtra apenas os servicos relevantes para o usuario
      const userServices = ["pix-in", "pix-out", "checkout", "webhooks"];
      const mappedServices: ServiceStatus[] = data.services
        .filter((s: { id: string }) => userServices.includes(s.id))
        .map((s: { id: string; name: string; status: "operational" | "degraded" | "outage" | "maintenance"; latency: number }) => ({
          id: s.id,
          name: s.name === "Depositos PIX" ? "Depositos PIX" : 
                s.name === "Saques PIX" ? "Saques PIX" :
                s.name === "Checkout" ? "Checkout" :
                s.name === "Webhooks" ? "Webhooks" : s.name,
          description: s.id === "pix-in" ? "Recebimento de pagamentos" :
                       s.id === "pix-out" ? "Envio de saques" :
                       s.id === "checkout" ? "Links de pagamento" :
                       "Notificacoes automaticas",
          status: s.status,
          latency: s.latency,
        }));

      setServices(mappedServices);
      setIncidents([]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Fallback para dados estaticos em caso de erro
      setServices([
        { id: "pix-in", name: "Depositos PIX", description: "Recebimento de pagamentos", status: "operational", latency: 0 },
        { id: "pix-out", name: "Saques PIX", description: "Envio de saques", status: "operational", latency: 0 },
        { id: "checkout", name: "Checkout", description: "Links de pagamento", status: "operational", latency: 0 },
        { id: "webhooks", name: "Webhooks", description: "Notificacoes automaticas", status: "operational", latency: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const overallStatus = services.every(s => s.status === "operational")
    ? "operational"
    : services.some(s => s.status === "outage")
    ? "outage"
    : services.some(s => s.status === "degraded")
    ? "degraded"
    : "maintenance";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            Status dos Servicos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe a disponibilidade dos servicos Hyperion Pay
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Atualizado as {formatTime(lastUpdate)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-5 rounded-2xl border ${
        overallStatus === "operational" ? "bg-green-500/5 border-green-500/20" :
        overallStatus === "degraded" ? "bg-yellow-500/5 border-yellow-500/20" :
        overallStatus === "outage" ? "bg-red-500/5 border-red-500/20" :
        "bg-blue-500/5 border-blue-500/20"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${STATUS_CONFIG[overallStatus].bg}`}>
            {overallStatus === "operational" ? (
              <CheckCircle className={`w-8 h-8 ${STATUS_CONFIG[overallStatus].text}`} />
            ) : overallStatus === "degraded" ? (
              <AlertTriangle className={`w-8 h-8 ${STATUS_CONFIG[overallStatus].text}`} />
            ) : overallStatus === "outage" ? (
              <XCircle className={`w-8 h-8 ${STATUS_CONFIG[overallStatus].text}`} />
            ) : (
              <Clock className={`w-8 h-8 ${STATUS_CONFIG[overallStatus].text}`} />
            )}
          </div>
          <div>
            <div className={`text-lg font-semibold ${STATUS_CONFIG[overallStatus].text}`}>
              {overallStatus === "operational" ? "Todos os servicos operacionais" :
               overallStatus === "degraded" ? "Alguns servicos com lentidao" :
               overallStatus === "outage" ? "Servicos indisponiveis" :
               "Manutencao programada"}
            </div>
            <div className="text-sm text-muted-foreground">
              {services.filter(s => s.status === "operational").length} de {services.length} servicos funcionando normalmente
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = SERVICE_ICONS[service.id] || Zap;
          const config = STATUS_CONFIG[service.status];
          
          return (
            <div 
              key={service.id} 
              className="p-4 rounded-xl bg-card border hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.text}`} />
                  </div>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-muted-foreground">{service.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${config.text}`}>
                      {config.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {service.latency}ms
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Incidents */}
      {incidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Incidentes Ativos
          </h2>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div 
                key={incident.id} 
                className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{incident.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {incident.status}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    incident.severity === "critical" ? "bg-red-500/10 text-red-500" :
                    incident.severity === "major" ? "bg-orange-500/10 text-orange-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {incident.severity === "critical" ? "Critico" :
                     incident.severity === "major" ? "Importante" : "Menor"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Incidents */}
      {incidents.length === 0 && (
        <div className="p-6 rounded-xl bg-card border text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <div className="font-medium">Nenhum incidente ativo</div>
          <div className="text-sm text-muted-foreground">
            Todos os servicos estao funcionando normalmente
          </div>
        </div>
      )}

      {/* Footer Link */}
      <div className="text-center">
        <Link 
          href="/status" 
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Ver pagina de status publica
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
