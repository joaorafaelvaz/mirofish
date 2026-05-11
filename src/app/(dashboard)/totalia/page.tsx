import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import TotaliaDashboard from "@/components/totalia/dashboard"

export default async function TotaliaPage() {
  const hasAccess = await hasModuleAccess(Module.TOTALIA)
  if (!hasAccess) redirect("/")

  return <TotaliaDashboard />
}
