import { handle, requireUnitId, apiOk } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

type BarbershopConfig = {
  chave: string
  valor: any
}

export const GET = handle(async () => {
  const unitId = await requireUnitId()
  const rows = await prisma.barbershopConfig.findMany({ where: { unitId } })
  // Return as key/value map
  const config = Object.fromEntries(rows.map((r: BarbershopConfig) => [r.chave, r.valor]))
  return apiOk(config)
})

export const POST = handle(async (req) => {
  const unitId = await requireUnitId()
  const body = await req.json() // { chave, valor } or { [key]: value, ... }

  if (body.chave) {
    const data = await prisma.barbershopConfig.upsert({
      where: { unitId_chave: { unitId, chave: body.chave } },
      create: { unitId, chave: body.chave, valor: body.valor },
      update: { valor: body.valor },
    })
    return apiOk(data)
  }

  // Bulk upsert
  const entries = Object.entries(body)
  await Promise.all(
    entries.map(([chave, valor]) =>
      prisma.barbershopConfig.upsert({
        where: { unitId_chave: { unitId, chave } },
        create: { unitId, chave, valor: valor as any },
        update: { valor: valor as any },
      })
    )
  )
  return apiOk({ ok: true })
})
