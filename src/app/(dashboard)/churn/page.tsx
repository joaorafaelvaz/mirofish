import { redirect } from "next/navigation"
import { hasModuleAccess } from "@/lib/permissions"
import { Module } from "@/generated/prisma/enums"
import ChurnDashboard from "@/components/churn/dashboard"

export default async function ChurnPage() {
  const hasAccess = await hasModuleAccess(Module.BARBERSHOP)
  if (!hasAccess) redirect("/")

  return <ChurnDashboard />
}
