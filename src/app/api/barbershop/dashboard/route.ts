import { handle, requireUnitId, apiOk } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

type BarbershopVenda = {
  valorLiquido: number | null
  clienteId?: string
  colaboradorId?: string
}

type BarbershopColaborador = {
  id: string
  nome: string
}

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const now = new Date()
  const ano = parseInt(searchParams.get("ano") ?? String(now.getFullYear()))
  const mes = parseInt(searchParams.get("mes") ?? String(now.getMonth() + 1))

  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0, 23, 59, 59)

  const inicioAnterior = new Date(ano, mes - 2, 1)
  const fimAnterior = new Date(ano, mes - 1, 0, 23, 59, 59)

  const [vendasMes, vendasMesAnterior, totalClientes, clientesAtivos, colaboradores] =
    await Promise.all([
      prisma.barbershopVenda.findMany({
        where: { unitId, vendaData: { gte: inicio, lte: fim } },
        select: { valorLiquido: true, clienteId: true, colaboradorId: true },
      }) as BarbershopVenda[],
      prisma.barbershopVenda.findMany({
        where: { unitId, vendaData: { gte: inicioAnterior, lte: fimAnterior } },
        select: { valorLiquido: true },
      }) as BarbershopVenda[],
      prisma.barbershopCliente.count({ where: { unitId } }),
      prisma.barbershopCliente.count({ where: { unitId, statusCliente: "ativo" } }),
      prisma.barbershopColaborador.findMany({
        where: { unitId, ativo: true },
        select: { id: true, nome: true },
      }) as BarbershopColaborador[],
    ])

  const faturamento = vendasMes.reduce((s: number, v: BarbershopVenda) => s + (v.valorLiquido ?? 0), 0)
  const faturamentoAnterior = vendasMesAnterior.reduce((s: number, v: BarbershopVenda) => s + (v.valorLiquido ?? 0), 0)
  const atendimentos = vendasMes.length
  const ticketMedio = atendimentos > 0 ? faturamento / atendimentos : 0
  const clientesUnicos = new Set(vendasMes.map((v: BarbershopVenda) => v.clienteId).filter(Boolean)).size

  // Por barbeiro
  const porBarbeiro = colaboradores.map((c: BarbershopColaborador) => {
    const cv = vendasMes.filter((v: BarbershopVenda) => v.colaboradorId === c.id)
    return {
      id: c.id,
      nome: c.nome,
      atendimentos: cv.length,
      faturamento: cv.reduce((s: number, v: BarbershopVenda) => s + (v.valorLiquido ?? 0), 0),
    }
  })

  // Evolução últimos 6 meses
  const evolucao: { mes: string; faturamento: number; atendimentos: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1)
    const m = d.getMonth() + 1
    const a = d.getFullYear()
    const ini = new Date(a, m - 1, 1)
    const fim2 = new Date(a, m, 0, 23, 59, 59)
    const v = await prisma.barbershopVenda.findMany({
      where: { unitId, vendaData: { gte: ini, lte: fim2 } },
      select: { valorLiquido: true },
    }) as BarbershopVenda[]
    evolucao.push({
      mes: `${String(m).padStart(2, "0")}/${a}`,
      faturamento: v.reduce((s: number, x: BarbershopVenda) => s + (x.valorLiquido ?? 0), 0),
      atendimentos: v.length,
    })
  }

  return apiOk({
    faturamento,
    faturamentoAnterior,
    atendimentos,
    ticketMedio,
    clientesUnicos,
    totalClientes,
    clientesAtivos,
    porBarbeiro,
    evolucao,
  })
})
