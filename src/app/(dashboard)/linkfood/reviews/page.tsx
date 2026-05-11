import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ReviewsPage from "@/components/linkfood/reviews-page"

export default async function LinkfoodReviewsPage() {
  const hasAccess = await hasModuleAccess(Module.LINKFOOD)
  if (!hasAccess) redirect("/")

  return <ReviewsPage />
}
