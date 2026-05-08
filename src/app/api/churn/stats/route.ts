import { handle, requireUnitId, apiOk } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

interface QueryRow {
  total: string | number
  score_medio?: string | number
  status?: string
  tipo_acao?: string
  enviadas?: string | number
  respondidas?: string | number
}

interface QueryResult extends Array<QueryRow> {
  [0]: QueryRow
}

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get("periodo") || "7d" // default: últimos 7 dias

  // Calcular data de início baseada no período
  const hoje = new Date()
  let dataInicio = new Date()
  switch (periodo) {
    case "7d":
      dataInicio.setDate(hoje.getDate() - 7)
      break
    case "30d":
      dataInicio.setDate(hoje.getDate() - 30)
      break
    case "90d":
      dataInicio.setDate(hoje.getDate() - 90)
      break
    case "all":
      dataInicio = new Date("2020-01-01") // data arbitrária antiga
      break
    default:
      dataInicio.setDate(hoje.getDate() - 7)
  }

  // Previsões por status
  const previsoesPorStatusRaw = (await prisma.$queryRaw`
    SELECT
      status,
      COUNT(*) as total,
      ROUND(AVG(score_risco), 1) as score_medio
    FROM churn_predictions
    WHERE unidade_id = ${unitId}
      AND previsao_data >= ${dataInicio}
    GROUP BY status
  `) as QueryResult

  // Ações por tipo
  const acoesPorTipoRaw = (await prisma.$queryRaw`
    SELECT
      tipo_acao,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'enviado') as enviadas,
      COUNT(*) FILTER (WHERE status = 'respondeu') as respondidas
    FROM churn_acoes
    WHERE unidade_id = ${unitId}
      AND data_acao >= ${dataInicio}
    GROUP BY tipo_acao
  `) as QueryResult

  // Total de clientes em risco
  const clientesEmRiscoRaw = (await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT cliente_id) as total
    FROM churn_predictions
    WHERE unidade_id = ${unitId}
      AND status IN ('em_risco', 'em_risco_alto')
      AND previsao_data = (
        SELECT MAX(previsao_data)
        FROM churn_predictions cp2
        WHERE cp2.cliente_id = churn_predictions.cliente_id
      )
  `) as QueryResult

  const previsoesPorStatus = previsoesPorStatusRaw
  const acoesPorTipo = acoesPorTipoRaw
  const clientesEmRisco = clientesEmRiscoRaw

  // Logs de processamento recentes
  const logsRecentes = await prisma.churnLog.findMany({
    where: {
      unitId: unitId,
      createdAt: { gte: dataInicio },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return apiOk({
    periodo,
    resumo: {
      totalPrevisoes: previsoesPorStatus.reduce((acc, item) => acc + Number(item.total), 0),
      clientesEmRisco: Number(clientesEmRisco[0].total),
      totalAcoes: acoesPorTipo.reduce((acc, item) => acc + Number(item.total), 0),
    },
    previsoesPorStatus,
    acoesPorTipo,
    logsRecentes,
  })
})
