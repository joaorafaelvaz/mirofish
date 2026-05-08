"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

type ChurnStatus = "ativo" | "em_risco" | "em_risco_alto" | "perdido"

interface ChurnPrediction {
  id: number
  clienteId: string
  unidadeId: string
  scoreRisco: number
  probabilidade: number
  features: any
  previsaoData: string
  proximaVisitaPrevista: string | null
  status: ChurnStatus
  clienteNome?: string
  clienteTelefone?: string
}

interface ChurnAcao {
  id: number
  clienteId: string
  unidadeId: string
  tipoAcao: "email" | "sms" | "whatsapp" | "desconto" | "alerta"
  mensagem: string | null
  status: "pendente" | "enviado" | "falhou" | "ignorado" | "respondeu"
  dataAcao: string | null
  clienteNome?: string
}

interface ChurnStats {
  totalPrevisoes: number
  clientesEmRisco: number
  totalAcoes: number
}

export default function ChurnDashboard() {
  const [predictions, setPredictions] = useState<ChurnPrediction[]>([])
  const [acoes, setAcoes] = useState<ChurnAcao[]>([])
  const [stats, setStats] = useState<ChurnStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("7d")

  useEffect(() => {
    fetchData()
  }, [periodo])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [predictionsRes, acoesRes, statsRes] = await Promise.all([
        fetch(`/api/churn/predict?periodo=${periodo}`),
        fetch(`/api/churn/trigger?periodo=${periodo}`),
        fetch(`/api/churn/stats?periodo=${periodo}`),
      ])

      if (predictionsRes.ok) {
        const data = await predictionsRes.json()
        setPredictions(data)
      }

      if (acoesRes.ok) {
        const data = await acoesRes.json()
        setAcoes(data)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.resumo)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: ChurnStatus) => {
    switch (status) {
      case "ativo":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "em_risco":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "em_risco_alto":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "perdido":
        return "bg-rose-100 text-rose-700 border-rose-200"
    }
  }

  const getStatusBadge = (status: ChurnStatus) => {
    switch (status) {
      case "ativo":
        return <Badge className={getStatusColor(status)}>Ativo</Badge>
      case "em_risco":
        return <Badge className={getStatusColor(status)}>Em Risco</Badge>
      case "em_risco_alto":
        return <Badge className={getStatusColor(status)}>Alto Risco</Badge>
      case "perdido":
        return <Badge className={getStatusColor(status)}>Perdido</Badge>
    }
  }

  const getActionIcon = (tipo: string) => {
    switch (tipo) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "alerta":
        return <AlertCircle className="h-4 w-4" />
      case "desconto":
        return <TrendingUp className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Churn Prediction</h1>
          <p className="text-muted-foreground">Detecção de evasão de clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todo o período</option>
          </select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Previsões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalPrevisoes}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes analisados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.clientesEmRisco}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes identificados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalAcoes}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Retenções disparadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">85%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimativa
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* High Risk Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Clientes em Alto Risco
            </div>
            <span className="text-xs text-muted-foreground">
              {predictions.filter((p) => ["em_risco_alto", "perdido"].includes(p.status)).length} clientes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma previsão realizada ainda.</p>
              <Button variant="link" onClick={() => document.getElementById("trigger-btn")?.click()}>
                Realizar previsão agora
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions
                .filter((p) => ["em_risco_alto", "perdido"].includes(p.status))
                .slice(0, 10)
                .map((prediction) => (
                  <div key={prediction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {prediction.clienteNome?.[0] || "C"}
                      </div>
                      <div>
                        <p className="font-medium">{prediction.clienteNome || `Cliente #${prediction.clienteId.slice(0, 8)}`}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: {prediction.scoreRisco}/100 • {prediction.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            prediction.scoreRisco > 80 ? "bg-rose-500" : prediction.scoreRisco > 60 ? "bg-orange-500" : "bg-amber-500"
                          )}
                          style={{ width: `${prediction.scoreRisco}%` }}
                        />
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {acoes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma ação de retenção foi disparada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {acoes.slice(0, 10).map((acao) => (
                <div key={acao.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {getActionIcon(acao.tipoAcao)}
                    <div>
                      <p className="text-sm font-medium">{acao.tipoAcao.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {acao.mensagem || "Ação automática"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {acao.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
