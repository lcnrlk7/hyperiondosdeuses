"use client";

import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, Calendar, ChevronRight, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Delivery {
  id: string;
  order_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  total: number;
  delivery_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  tracking_code?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  seller_name?: string;
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  processing: { label: "Preparando", color: "bg-blue-500/20 text-blue-500", icon: Package },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-500", icon: Clock },
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await fetch("/api/checkout/my-orders");
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.orders || []);
      }
    } catch (error) {
      console.error("Erro ao carregar entregas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch = delivery.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.order_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || delivery.delivery_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas Entregas</h1>
        <p className="text-muted-foreground">Acompanhe o status das suas compras e entregas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.delivery_status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.delivery_status === "processing").length}</p>
                <p className="text-xs text-muted-foreground">Preparando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Truck className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.delivery_status === "shipped").length}</p>
                <p className="text-xs text-muted-foreground">Em transito</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveries.filter(d => d.delivery_status === "delivered").length}</p>
                <p className="text-xs text-muted-foreground">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, codigo de rastreio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="processing">Preparando</SelectItem>
                <SelectItem value="shipped">Enviados</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma entrega encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Suas compras aparecerao aqui quando voce realizar pedidos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => {
            const status = statusConfig[delivery.delivery_status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <Card
                key={delivery.id}
                className="bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => setSelectedDelivery(selectedDelivery?.id === delivery.id ? null : delivery)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                      {delivery.product_image ? (
                        <img
                          src={delivery.product_image}
                          alt={delivery.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">{delivery.product_name || "Produto"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Pedido #{delivery.order_id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(delivery.created_at)}
                        </span>
                        <span>Qtd: {delivery.quantity || 1}</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(delivery.total || 0)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${selectedDelivery?.id === delivery.id ? "rotate-90" : ""}`} />
                  </div>

                  {/* Expanded Details */}
                  {selectedDelivery?.id === delivery.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Tracking */}
                      {delivery.tracking_code && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm text-muted-foreground">Codigo de Rastreio</p>
                            <p className="font-mono font-semibold">{delivery.tracking_code}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(delivery.tracking_code || "");
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      )}

                      {/* Address */}
                      {(delivery.shipping_address || delivery.shipping_city) && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            Endereco de Entrega
                          </p>
                          <p className="font-medium">
                            {delivery.shipping_address}
                            {delivery.shipping_city && `, ${delivery.shipping_city}`}
                            {delivery.shipping_state && ` - ${delivery.shipping_state}`}
                            {delivery.shipping_zip && ` | CEP: ${delivery.shipping_zip}`}
                          </p>
                        </div>
                      )}

                      {/* Estimated Delivery */}
                      {delivery.estimated_delivery && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-sm text-muted-foreground">Previsao de Entrega</p>
                          <p className="font-semibold">{formatDate(delivery.estimated_delivery)}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Historico do Pedido</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm">Pedido realizado</span>
                            <span className="text-xs text-muted-foreground ml-auto">{formatDate(delivery.created_at)}</span>
                          </div>
                          {delivery.delivery_status !== "pending" && (
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-sm">Pagamento confirmado</span>
                            </div>
                          )}
                          {(delivery.delivery_status === "shipped" || delivery.delivery_status === "delivered") && (
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              <span className="text-sm">Produto enviado</span>
                            </div>
                          )}
                          {delivery.delivery_status === "delivered" && (
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-sm">Entrega concluida</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
