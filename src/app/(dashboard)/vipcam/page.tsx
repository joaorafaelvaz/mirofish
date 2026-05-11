import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import VipCamDashboard from "@/components/vipcam/dashboard"

export default async function VipcamPage() {
  const hasAccess = await hasModuleAccess(Module.VIPCAM)
  if (!hasAccess) redirect("/")

  return <VipCamDashboard />
}
