import { handle, requireUnitId, apiOk, apiError } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const acoes = await prisma.churnAcao.findMany({
    where: {
      unidadeId: unitId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      cliente: true,
    },
    take: 100,
  })

  return apiOk(acoes)
})

export const POST = handle(async (req) => {
  const unitId = await requireUnitId()
  const body = await req.json()
  const { clienteId, tipoAcao, mensagem } = body

  if (!clienteId || !tipoAcao) {
    return apiError("client_id and tipo_acao are required", 400)
  }

  // Validar tipo de ação
  const tiposValidos = ["email", "sms", "whatsapp", "desconto", "alerta"]
  if (!tiposValidos.includes(tipoAcao)) {
    return apiError("Invalid action type", 400)
  }

  // Criar ação
  const acao = await prisma.churnAcao.create({
    data: {
      clienteId,
      unidadeId: unitId,
      tipoAcao,
      mensagem: mensagem || null,
      status: "pendente",
      dataAcao: new Date(),
    },
    include: {
      cliente: true,
    },
  })

  return apiOk(acao, 201)
})

export const PATCH = handle(async (req) => {
  const unitId = await requireUnitId()
  const body = await req.json()
  const { acaoId, status } = body

  if (!acaoId || !status) {
    return apiError("acao_id and status are required", 400)
  }

  // Validar status
  const statusesValidos = ["pendente", "enviado", "falhou", "ignorado", "respondeu"]
  if (!statusesValidos.includes(status)) {
    return apiError("Invalid status", 400)
  }

  // Atualizar ação
  const acao = await prisma.churnAcao.update({
    where: { id: acaoId },
    data: { status, dataAcao: new Date() },
    include: {
      cliente: true,
    },
  })

  return apiOk(acao)
})
