import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import AnalyticsPage from "@/components/vipcam/analytics-page"

export default async function VipCamAnalyticsRoute() {
  const hasAccess = await hasModuleAccess(Module.VIPCAM)
  if (!hasAccess) redirect("/")
  return <AnalyticsPage />
}
