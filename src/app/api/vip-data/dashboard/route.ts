import { prisma } from "@/lib/prisma"
import { requireUnitId, handle, apiOk } from "@/lib/totalia/crud"
import { startOfMonth, subMonths, format } from "date-fns"

type BarbershopVenda = {
  vendaData?: Date | null
  valorLiquido?: number | null
  colaboradorId?: string | null
}

export const GET = handle(async () => {
  const unitId = await requireUnitId()
  const now = new Date()
  const mesAtual = format(now, "yyyy-MM")
  const mesAnterior = format(subMonths(now, 1), "yyyy-MM")

  // Vendas do mês (usa BarbershopVenda)
  const vendas = await prisma.barbershopVenda.findMany({
    where: { unitId },
    orderBy: { vendaData: "desc" },
    take: 1000,
  }) as BarbershopVenda[]

  const vendasMesAtual = vendas.filter((v) => {
    const mes = format(v.vendaData ?? new Date(0), "yyyy-MM")
    return mes === mesAtual
  })

  const vendasMesAnterior = vendas.filter((v) => {
    const mes = format(v.vendaData ?? new Date(0), "yyyy-MM")
    return mes === mesAnterior
  })

  const faturamentoAtual = vendasMesAtual.reduce((s, v) => s + (v.valorLiquido ?? 0), 0)
  const faturamentoAnterior = vendasMesAnterior.reduce((s, v) => s + (v.valorLiquido ?? 0), 0)
  const atendimentos = vendasMesAtual.length
  const ticketMedio = atendimentos > 0 ? faturamentoAtual / atendimentos : 0

  // Colaboradores ativos
  const colaboradores = await prisma.barbershopColaborador.count({ where: { unitId, ativo: true } })

  // Serviços ativos
  const servicos = await prisma.vipDataServico.count({ where: { unitId, ativo: true } })

  // Folgas do mês
  const folgasMes = await prisma.vipDataFolga.count({
    where: {
      unitId,
      data: {
        gte: startOfMonth(now),
      },
    },
  })

  // Evolução 6 meses
  const evolucao = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      const mesStr = format(d, "yyyy-MM")
      const total = vendas
        .filter((v) => format(v.vendaData ?? new Date(0), "yyyy-MM") === mesStr)
        .reduce((s, v) => s + (v.valorLiquido ?? 0), 0)
      return { mes: format(d, "MMM/yy"), total }
    })
  )

  // Ranking por colaborador (mês atual)
  const porColaborador: Record<string, { nome: string; total: number; atendimentos: number }> = {}
  for (const v of vendasMesAtual) {
    const nome = v.colaboradorId ?? "desconhecido"
    if (!porColaborador[nome]) porColaborador[nome] = { nome, total: 0, atendimentos: 0 }
    porColaborador[nome].total += v.valorLiquido ?? 0
    porColaborador[nome].atendimentos += 1
  }
  const ranking = Object.values(porColaborador)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Sync logs recentes
  const syncLogs = await prisma.vipDataSyncLog.findMany({
    where: { unitId },
    orderBy: { iniciadoEm: "desc" },
    take: 5,
  })

  return apiOk({
    faturamentoAtual,
    faturamentoAnterior,
    atendimentos,
    ticketMedio,
    colaboradores,
    servicos,
    folgasMes,
    evolucao,
    ranking,
    syncLogs,
  })
})
