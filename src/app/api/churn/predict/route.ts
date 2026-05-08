import { handle, requireUnitId, apiOk, apiError } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"
import { ChurnPredictor } from "@/lib/churn/predictor"
import { calculateChurnFeatures } from "@/lib/churn/features"
import { getSelectedUnitId } from "@/lib/permissions"

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("client_id")

  // Se fornecido client_id, buscar apenas esse cliente
  if (clientId) {
    const cliente = await prisma.barbershopCliente.findFirst({
      where: { id: clientId, unitId },
    })

    if (!cliente) {
      return apiError("Cliente not found", 404)
    }

    const features = calculateChurnFeatures(cliente)
    const predictor = new ChurnPredictor()
    const prediction = predictor.predict(features)

    return apiOk({
      cliente,
      features,
      prediction,
    })
  }

  // Caso contrário, buscar todos os clientes com predição
  const clientes = await prisma.barbershopCliente.findMany({
    where: { unitId },
    orderBy: { ultimaVisita: "desc" },
    take: 100,
  })

  const results = []
  const predictor = new ChurnPredictor()

  for (const cliente of clientes) {
    const features = calculateChurnFeatures(cliente)
    const prediction = predictor.predict(features)
    results.push({ cliente, features, prediction })
  }

  return apiOk(results)
})

export const POST = handle(async (req) => {
  const unitId = await requireUnitId()
  const body = await req.json()
  const { clientId } = body

  if (!clientId) {
    return apiError("client_id is required", 400)
  }

  const cliente = await prisma.barbershopCliente.findFirst({
    where: { id: clientId, unitId },
  })

  if (!cliente) {
    return apiError("Cliente not found", 404)
  }

  const features = calculateChurnFeatures(cliente)
  const predictor = new ChurnPredictor()
  const prediction = predictor.predict(features)

  // Salvar a previsão no banco
  const churnPrediction = await prisma.churnPrediction.create({
    data: {
      clienteId: cliente.id,
      unidadeId: unitId,
      scoreRisco: prediction.score,
      probabilidade: prediction.probability,
      features: JSON.stringify(features),
      previsaoData: new Date(),
      status: prediction.status,
    },
  })

  // Se o status for em_risco ou em_risco_alto, criar uma ação
  if (["em_risco", "em_risco_alto"].includes(prediction.status)) {
    await prisma.churnAcao.create({
      data: {
        clienteId: cliente.id,
        unidadeId: unitId,
        tipoAcao: "alerta",
        mensagem: `Cliente ${cliente.nome} está em risco de churn com score ${prediction.score}`,
        status: "pendente",
      },
    })
  }

  return apiOk(
    {
      cliente,
      features,
      prediction,
      predictionId: churnPrediction.id,
    },
    201
  )
})
