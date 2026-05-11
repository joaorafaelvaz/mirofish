import { prisma } from "@/lib/prisma"
import { requireUnitId, handle, apiOk } from "@/lib/totalia/crud"
import { subHours, subDays } from "date-fns"

type EmocaoDominanteGroup = {
  emocaoDominante: string
  _count: { id: number }
}

export const GET = handle(async () => {
  const unitId = await requireUnitId()
  const now = new Date()
  const hoje = subHours(now, 24)
  const semana = subDays(now, 7)

  const [
    totalCameras,
    camerasAtivas,
    totalPessoas,
    pessoasHoje,
    clientes,
    colaboradores,
  ] = await prisma.$transaction([
    prisma.vipCamCamera.count({ where: { unitId } }),
    prisma.vipCamCamera.count({ where: { unitId, isActive: true } }),
    prisma.vipCamPessoa.count({ where: { unitId } }),
    prisma.vipCamPessoa.count({ where: { unitId, ultimaVista: { gte: hoje } } }),
    prisma.vipCamPessoa.count({ where: { unitId, tipoPessoa: "cliente" } }),
    prisma.vipCamPessoa.count({ where: { unitId, tipoPessoa: "colaborador" } }),
  ])

  // Satisfação média (últimas 24h)
  const avgSat = await prisma.vipCamEmocaoRecord.aggregate({
    where: { unitId, capturedAt: { gte: hoje }, satisfacaoScore: { not: null } },
    _avg: { satisfacaoScore: true },
  })

  // Ocupação média (últimas 24h)
  const avgOcup = await prisma.vipCamCameraEvento.aggregate({
    where: { unitId, capturedAt: { gte: hoje }, tipoEvento: "occupancy_snapshot" },
    _avg: { pessoaCount: true },
  })

  // Emoções dominantes últimas 24h
  const emocoesDominantes = await prisma.vipCamEmocaoRecord.groupBy({
    by: ["emocaoDominante"],
    where: { unitId, capturedAt: { gte: hoje }, emocaoDominante: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  })

  // Visitas por dia (últimos 7 dias)
  const visitasPorDia = await prisma.vipCamCameraEvento.findMany({
    where: { unitId, capturedAt: { gte: semana }, tipoEvento: "occupancy_snapshot" },
    select: { capturedAt: true, pessoaCount: true },
    orderBy: { capturedAt: "asc" },
  })

  // Câmeras com status
  const cameras = await prisma.vipCamCamera.findMany({
    where: { unitId },
    select: { id: true, nome: true, localizacao: true, isActive: true },
    orderBy: { nome: "asc" },
  })

  const settings = await prisma.vipCamSettings.findUnique({ where: { unitId } })

  return apiOk({
    totalCameras,
    camerasAtivas,
    totalPessoas,
    pessoasHoje,
    clientes,
    colaboradores,
    avgSatisfacao: avgSat._avg.satisfacaoScore ?? null,
    avgOcupacao: avgOcup._avg.pessoaCount ?? null,
    emocoesDominantes: emocoesDominantes.map((e: EmocaoDominanteGroup) => ({
      emocao: e.emocaoDominante,
      count: e._count.id,
    })),
    visitasPorDia,
    cameras,
    pipelineAtivo: settings?.pipelineAtivo ?? false,
    backendUrl: settings?.backendUrl ?? null,
  })
})
