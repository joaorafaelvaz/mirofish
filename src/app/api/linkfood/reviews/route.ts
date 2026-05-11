import { handle, requireUnitId, apiOk } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

type LinkfoodReview = {
  rating: number
  platform: string
  sentiment: string
}

export const GET = handle(async (req) => {
  const unitId = await requireUnitId()
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get("businessId")
  const platform = searchParams.get("platform")
  const sentiment = searchParams.get("sentiment")
  const minRating = searchParams.get("minRating")
  const maxRating = searchParams.get("maxRating")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50

  const data = await prisma.linkfoodReview.findMany({
    where: {
      unitId,
      ...(businessId ? { businessId } : {}),
      ...(platform ? { platform } : {}),
      ...(sentiment ? { sentiment } : {}),
      ...(minRating || maxRating
        ? {
            rating: {
              ...(minRating ? { gte: parseFloat(minRating) } : {}),
              ...(maxRating ? { lte: parseFloat(maxRating) } : {}),
            },
          }
        : {}),
    },
    orderBy: { reviewDate: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.linkfoodReview.count({
    where: {
      unitId,
      ...(businessId ? { businessId } : {}),
      ...(platform ? { platform } : {}),
    },
  })

  return apiOk({ reviews: data, total, page, limit })
})

export const POST = handle(async (req) => {
  const unitId = await requireUnitId()
  const body = await req.json()

  const sentiment =
    body.rating >= 4 ? "POSITIVE" : body.rating >= 3 ? "NEUTRAL" : "NEGATIVE"

  const data = await prisma.linkfoodReview.create({
    data: {
      unitId,
      platform: body.platform ?? "MANUAL",
      sentiment,
      ...body,
      externalId: body.externalId ?? `manual-${Date.now()}`,
    },
  })

  // Update summary
  await recalcSummary(unitId, body.businessId)

  return apiOk(data, 201)
})

async function recalcSummary(unitId: string, businessId: string) {
  const reviews = await prisma.linkfoodReview.findMany({
    where: { unitId, businessId },
    select: { rating: true, platform: true, sentiment: true },
  }) as LinkfoodReview[]
  if (!reviews.length) return

  const avg = reviews.reduce((s: number, r: LinkfoodReview) => s + r.rating, 0) / reviews.length
  const byPlatform: Record<string, { count: number; sum: number }> = {}
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const sent = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 }

  for (const r of reviews) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = { count: 0, sum: 0 }
    byPlatform[r.platform].count++
    byPlatform[r.platform].sum += r.rating
    const star = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5
    if (star >= 1 && star <= 5) dist[star]++
    if (r.sentiment) sent[r.sentiment as keyof typeof sent]++
  }

  await prisma.linkfoodReviewSummary.upsert({
    where: { businessId },
    create: {
      businessId,
      averageRating: avg,
      totalReviews: reviews.length,
      ratingsByPlatform: byPlatform,
      ratingDistribution: dist,
      sentimentSummary: sent,
    },
    update: {
      averageRating: avg,
      totalReviews: reviews.length,
      ratingsByPlatform: byPlatform,
      ratingDistribution: dist,
      sentimentSummary: sent,
    },
  })
}
