import { handle, requireUnitId, apiOk } from "@/lib/totalia/crud"
import { prisma } from "@/lib/prisma"

type LinkfoodReviewSummary = {
  averageRating: number
}

export const GET = handle(async () => {
  const unitId = await requireUnitId()

  const [businesses, totalReviews, recentReviews, summaries] = await Promise.all([
    prisma.linkfoodBusiness.findMany({
      where: { unitId },
      select: { id: true, name: true, category: true },
    }),
    prisma.linkfoodReview.count({ where: { unitId } }),
    prisma.linkfoodReview.findMany({
      where: { unitId },
      orderBy: { reviewDate: "desc" },
      take: 10,
      select: {
        id: true,
        platform: true,
        rating: true,
        authorName: true,
        content: true,
        reviewDate: true,
        sentiment: true,
        businessId: true,
      },
    }),
    prisma.linkfoodReviewSummary.findMany({
      where: { business: { unitId } },
      include: { business: { select: { name: true } } },
    }) as LinkfoodReviewSummary[],
  ])

  // Average across all businesses
  const avgRating =
    summaries.length > 0
      ? summaries.reduce((s, r) => s + r.averageRating, 0) / summaries.length
      : 0

  // Sentiment breakdown across all reviews
  const sentimentCounts = await prisma.linkfoodReview.groupBy({
    by: ["sentiment"],
    where: { unitId },
    _count: { id: true },
  })

  // Platform distribution
  const platformCounts = await prisma.linkfoodReview.groupBy({
    by: ["platform"],
    where: { unitId },
    _count: { id: true },
    _avg: { rating: true },
  })

  return apiOk({
    totalBusinesses: businesses.length,
    businesses,
    totalReviews,
    avgRating,
    recentReviews,
    summaries,
    sentimentCounts,
    platformCounts,
  })
})
