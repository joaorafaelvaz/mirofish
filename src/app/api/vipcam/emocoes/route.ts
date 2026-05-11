import { prisma } from "@/lib/prisma"
import { requireUnitId, handle, apiOk } from "@/lib/totalia/crud"
import { subHours } from "date-fns"

type EmocaoDominanteGroup = {
  emocaoDominante: string | null
  _count: { id: number }
}

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const horas = parseInt(searchParams.get("horas") ?? "24")
  const cameraId = searchParams.get("cameraId")
  const since = subHours(new Date(), horas)

  const where = {
    unitId,
    capturedAt: { gte: since },
    ...(cameraId ? { cameraId } : {}),
  }

  // Distribuição de emoções
  const distribuicao = await prisma.vipCamEmocaoRecord.groupBy({
    by: ["emocaoDominante"],
    where: { ...where, emocaoDominante: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  })

  // Satisfação média por hora
  const registros = await prisma.vipCamEmocaoRecord.findMany({
    where,
    select: { capturedAt: true, satisfacaoScore: true, emocaoDominante: true },
    orderBy: { capturedAt: "asc" },
    take: 500,
  })

  // Resumo geral
  const resumo = await prisma.vipCamEmocaoRecord.aggregate({
    where,
    _avg: { satisfacaoScore: true, valence: true, arousal: true },
    _count: { id: true },
  })

  return apiOk({
    distribuicao: distribuicao.map((d: EmocaoDominanteGroup) => ({
      emocao: d.emocaoDominante ?? "desconhecido",
      count: d._count.id,
    })),
    registros,
    resumo: {
      total: resumo._count.id,
      avgSatisfacao: resumo._avg.satisfacaoScore,
      avgValence: resumo._avg.valence,
      avgArousal: resumo._avg.arousal,
    },
  })
})
