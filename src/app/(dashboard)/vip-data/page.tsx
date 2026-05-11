import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import VipDataDashboard from "@/components/vip-data/dashboard"

export default async function VipDataPage() {
  const hasAccess = await hasModuleAccess(Module.VIP_DATA)
  if (!hasAccess) redirect("/")

  return <VipDataDashboard />
}
