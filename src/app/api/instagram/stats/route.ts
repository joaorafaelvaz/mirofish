import { handle, requireUnitId, apiOk } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

type InstagramBotStats = {
  repliesPosted: number
  repliesSimulated: number
  spamDetected: number
  errorsCount: number
  checksRun: number
}

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("accountId")
  const days = parseInt(searchParams.get("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split("T")[0]

  const stats = await prisma.instagramBotStats.findMany({
    where: {
      unitId,
      ...(accountId ? { accountId } : {}),
      date: { gte: sinceStr },
    },
    orderBy: { date: "asc" },
  })

  const totals = stats.reduce(
    (acc: InstagramBotStats, s: InstagramBotStats) => ({
      repliesPosted: acc.repliesPosted + s.repliesPosted,
      repliesSimulated: acc.repliesSimulated + s.repliesSimulated,
      spamDetected: acc.spamDetected + s.spamDetected,
      errorsCount: acc.errorsCount + s.errorsCount,
      checksRun: acc.checksRun + s.checksRun,
    }),
    { repliesPosted: 0, repliesSimulated: 0, spamDetected: 0, errorsCount: 0, checksRun: 0 } as InstagramBotStats
  )

  return apiOk({ stats, totals })
})
