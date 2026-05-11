import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import LinkfoodDashboard from "@/components/linkfood/dashboard"

export default async function LinkfoodPage() {
  const hasAccess = await hasModuleAccess(Module.LINKFOOD)
  if (!hasAccess) redirect("/")

  return <LinkfoodDashboard />
}
