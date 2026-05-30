"use client"

import { useState, useEffect } from "react"
import { 
  Globe, 
  Search, 
  Power, 
  PowerOff, 
  Eye,
  RefreshCw,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Trash2,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Tenant {
  id: string
  user_id: string
  name: string
  slug: string
  domain_app: string | null
  domain_admin: string | null
  is_active: boolean
  setup_paid: boolean
  subscription_status: string
  subscription_expires_at: string | null
  monthly_fee: number
  created_at: string
  user_email?: string
  user_name?: string
}

interface Stats {
  total: number
  active: number
  pending: number
  expired: number
  totalRevenue: number
  monthlyRevenue: number
}

export default function WhiteLabelAdminPage() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "expired">("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/white-label")
      const data = await response.json()
      
      if (data.success) {
        setTenants(data.tenants || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    }
    setLoading(false)
  }

  const toggleTenant = async (tenantId: string, activate: boolean) => {
    setActionLoading(tenantId)
    try {
      const response = await fetch("/api/admin/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tenantId, 
          action: activate ? "activate" : "deactivate" 
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success(activate ? "Plataforma ativada!" : "Plataforma desativada!")
        loadData()
      } else {
        toast.error(data.error || "Erro ao processar")
      }
    } catch (error) {
      toast.error("Erro ao processar")
    }
    setActionLoading(null)
  }

  const renewSubscription = async (tenantId: string) => {
    setActionLoading(tenantId)
    try {
      const response = await fetch("/api/admin/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action: "renew" }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Assinatura renovada por mais 30 dias!")
        loadData()
      } else {
        toast.error(data.error || "Erro ao renovar")
      }
    } catch (error) {
      toast.error("Erro ao processar")
    }
    setActionLoading(null)
  }

  const approveSetup = async (tenantId: string) => {
    setActionLoading(tenantId)
    try {
      const response = await fetch("/api/admin/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action: "approve_setup" }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Setup aprovado! Plataforma ativada.")
        loadData()
      } else {
        toast.error(data.error || "Erro ao aprovar")
      }
    } catch (error) {
      toast.error("Erro ao processar")
    }
    setActionLoading(null)
  }

  const deleteTenant = async (tenantId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta plataforma? Esta acao e irreversivel.")) {
      return
    }
    
    setActionLoading(tenantId)
    try {
      const response = await fetch("/api/admin/white-label", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success("Plataforma excluida!")
        loadData()
      } else {
        toast.error(data.error || "Erro ao excluir")
      }
    } catch (error) {
      toast.error("Erro ao processar")
    }
    setActionLoading(null)
  }

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.domain_app?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(search.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filter === "active") return t.is_active && t.subscription_status === "active"
    if (filter === "pending") return !t.setup_paid || t.subscription_status === "pending"
    if (filter === "expired") return t.subscription_status === "expired"
    
    return true
  })

  const getStatusBadge = (tenant: Tenant) => {
    if (!tenant.setup_paid) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Aguardando Setup</span>
    }
    if (tenant.subscription_status === "expired") {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-500">Expirado</span>
    }
    if (tenant.subscription_status === "active" && tenant.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Ativo</span>
    }
    if (!tenant.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-500">Desativado</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Pendente</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">White Labels</h1>
          <p className="text-muted-foreground">Gerencie as plataformas White Label</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">Expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">R$ {stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Receita Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">R$ {stats.monthlyRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Receita Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, dominio ou email..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Ativos
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === "expired" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("expired")}
          >
            Expirados
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plataforma</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Proprietario</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Dominio</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expira em</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Mensalidade</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma plataforma encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-foreground">{tenant.user_name || "-"}</p>
                          <p className="text-xs text-muted-foreground">{tenant.user_email || tenant.user_id}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {tenant.domain_app ? (
                          <a 
                            href={`https://${tenant.domain_app}`} 
                            target="_blank" 
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {tenant.domain_app}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nao configurado</span>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(tenant)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground">
                          {tenant.subscription_expires_at
                            ? new Date(tenant.subscription_expires_at).toLocaleDateString("pt-BR")
                            : "-"
                          }
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground">
                          R$ {tenant.monthly_fee?.toFixed(2) || "50.00"}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {!tenant.setup_paid && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => approveSetup(tenant.id)}
                              disabled={actionLoading === tenant.id}
                              className="bg-green-600 hover:bg-green-700"
                              title="Aprovar Setup (confirmar pagamento)"
                            >
                              {actionLoading === tenant.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          {tenant.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleTenant(tenant.id, false)}
                              disabled={actionLoading === tenant.id}
                              className="text-red-500 hover:text-red-600"
                            >
                              {actionLoading === tenant.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <PowerOff className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleTenant(tenant.id, true)}
                              disabled={actionLoading === tenant.id}
                              className="text-green-500 hover:text-green-600"
                            >
                              {actionLoading === tenant.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => renewSubscription(tenant.id)}
                            disabled={actionLoading === tenant.id}
                            title="Renovar +30 dias"
                          >
                            {actionLoading === tenant.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTenant(tenant.id)}
                            disabled={actionLoading === tenant.id}
                            className="text-red-500 hover:text-red-600"
                            title="Excluir"
                          >
                            {actionLoading === tenant.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
